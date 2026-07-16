import { Directory, File, Paths } from "expo-file-system";
import { unzip, zip } from "react-native-zip-archive";
import {
  createDayMemoryForImport,
  createTimeMemoryForImport,
  createTimeMemoryMedia,
  createTimeMemoryQA,
  deleteTimeMemoryMediaByTimeMemoryId,
  deleteTimeMemoryQAByTimeMemoryId,
  getAllLocationsByUserId,
  getDayMemoriesByUserId,
  getDayMemoryById,
  getDayMemoryByUserIdAndDay,
  getLocationById,
  getLocationSettingsByUserId,
  getNotificationsByUserId,
  getRegisteredUserId,
  getTimeMemoriesByDayMemoryId,
  getTimeMemoryByDayMemoryIdAndTime,
  getTimeMemoryMediaByTimeMemoryId,
  getTimeMemoryQAByTimeMemoryId,
  getUserIdByUsername,
  getUserProfile,
  insertLocationForImport,
  insertNotificationForImport,
  insertUserIntoDB,
  locationExistsAtTime,
  notificationExistsAtTime,
  createLocationSettings,
  setUserPreferredLoginMethod,
  setUserProfileImagePath,
  updateDayMemoryForImport,
  updateLocationSettings,
  updateTimeMemoryForImport,
} from "@/services/database";
import {
  deleteMedia,
  MediaType,
  readMediaBytes,
  saveAudioPersistently,
  saveImagePersistently,
  saveVideoPersistently,
} from "@/services/mediaStorage";
import { saveProfilePicture } from "@/services/profilePictureStorage";

// Bump only on a breaking change to the archive layout. Import refuses
// anything it doesn't recognise rather than guessing at an unknown shape.
const SCHEMA_VERSION = 1;

const MANIFEST_NAME = "manifest.json";
const DATA_NAME = "data.json";
const MEDIA_DIR = "media";

// ===== ARCHIVE TYPES =====

interface BackupManifest {
  schemaVersion: number;
  exportedAt: string;
}

interface BackupMedia {
  // Logical name inside the archive (e.g. "media/0001.jpg"). Never a device
  // path — the original uri is meaningless on any other install.
  zipPath: string;
  mediaType: MediaType;
}

interface BackupQA {
  question: string;
  answer: string;
}

interface BackupLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

interface BackupTimeMemory {
  timeOfRecord: string;
  summary: string;
  createdAt: string;
  lastUpdatedTime: string;
  location: BackupLocation | null;
  media: BackupMedia[];
  questionnaire: BackupQA[];
}

interface BackupDayMemory {
  day: string;
  summary: string;
  createdAt: string;
  lastUpdatedTime: string;
  timeMemories: BackupTimeMemory[];
}

interface BackupData {
  user: {
    username: string;
    profileImagePath: string | null; // zip path, not a device path
    preferredLoginMethod: string | null;
  };
  locationSettings: {
    fetchFrequency: number;
    notificationThreshold: number;
    restThreshold: number;
    locationTrackingPollFrequency: number;
  } | null;
  locations: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    createdDateTime: string;
  }[];
  notifications: {
    notificationMessage: string;
    createdAt: string;
  }[];
  dayMemories: BackupDayMemory[];
}

// ===== HELPERS =====

// react-native-zip-archive works in plain filesystem paths, while
// expo-file-system speaks file:// URIs. Everything crossing that boundary
// goes through here.
const toPath = (uri: string): string =>
  uri.startsWith("file://")
    ? decodeURIComponent(uri.replace("file://", ""))
    : uri;

// This schema stores timestamps in two shapes: columns filled by
// `DEFAULT CURRENT_TIMESTAMP` look like "2026-07-01 23:00:00" (UTC, but with a
// space and no zone), while code paths that write `new Date().toISOString()`
// produce "2026-07-01T09:00:00.000Z". So a never-edited row and an edited row
// disagree on format, and comparing them as raw strings is wrong — " " (0x20)
// sorts before "T" (0x54), which would let an OLDER backup memory overwrite a
// NEWER local one whenever the dates match. Normalise to epoch millis instead.
const SQLITE_TIMESTAMP = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;

const parseDbTimestamp = (value: string): number => {
  const match = SQLITE_TIMESTAMP.exec(value);
  // CURRENT_TIMESTAMP is UTC, but JS would read the bare form as local time.
  const normalized = match ? `${match[1]}T${match[2]}Z` : value;
  const ms = Date.parse(normalized);
  // Unparseable reads as "very old", so a bad value never overwrites good data.
  return Number.isNaN(ms) ? 0 : ms;
};

const isNewerThan = (candidate: string, existing: string): boolean =>
  parseDbTimestamp(candidate) > parseDbTimestamp(existing);

const extensionFor = (mediaType: MediaType, sourceUri: string): string => {
  const match = /\.([a-zA-Z0-9]+)$/.exec(sourceUri);
  if (match) return match[1].toLowerCase();
  // Fall back to the format each save path actually writes.
  if (mediaType === "video") return "mp4";
  if (mediaType === "audio") return "m4a";
  return "jpg";
};

// A fresh, empty scratch directory under cache. Cache is right for this: the
// OS may reclaim it, and the finished zip is handed straight to the share
// sheet rather than kept around.
const makeStagingDir = async (name: string): Promise<Directory> => {
  const dir = new Directory(Paths.cache, name);
  try {
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn(`Failed to clear stale staging dir ${name}:`, error);
  }
  await dir.create({ intermediates: true });
  return dir;
};

const cleanUp = (dir: Directory) => {
  try {
    if (dir.exists) dir.delete();
  } catch (error) {
    // Non-fatal: cache gets reclaimed by the OS anyway.
    console.warn(`Failed to clean up ${dir.uri}:`, error);
  }
};

// ===== EXPORT =====

// Builds a .zip snapshot of the user's data and returns a file:// uri to it,
// ready to hand to Sharing.shareAsync.
export const buildExportZip = async (userId: number): Promise<string> => {
  const profile = getUserProfile(userId);
  if (!profile) {
    throw new Error("No user profile found to export");
  }

  const stagingDir = await makeStagingDir("backup-export");

  try {
    const mediaDir = new Directory(stagingDir, MEDIA_DIR);
    await mediaDir.create({ intermediates: true });

    let mediaCounter = 0;
    let skippedMedia = 0;

    // Copies one media item's bytes into the staging dir, returning its
    // logical archive path — or null if the bytes couldn't be read.
    const stageMedia = async (
      mediaUri: string,
      mediaType: MediaType,
      mediaLibraryAssetId: string | null,
    ): Promise<string | null> => {
      const bytes = await readMediaBytes(mediaUri, mediaLibraryAssetId);
      if (!bytes) {
        skippedMedia += 1;
        return null;
      }
      mediaCounter += 1;
      const name = `${String(mediaCounter).padStart(4, "0")}.${extensionFor(mediaType, mediaUri)}`;
      const target = new File(mediaDir, name);
      target.create();
      target.write(bytes);
      return `${MEDIA_DIR}/${name}`;
    };

    // Profile picture is always app-private, so it reads like any local file.
    let profileImageZipPath: string | null = null;
    if (profile.profileImagePath) {
      profileImageZipPath = await stageMedia(
        profile.profileImagePath,
        "image",
        null,
      );
    }

    const dayMemories: BackupDayMemory[] = [];
    for (const dayMemory of getDayMemoriesByUserId(userId)) {
      const timeMemories: BackupTimeMemory[] = [];

      for (const timeMemory of getTimeMemoriesByDayMemoryId(dayMemory.id)) {
        // Inline this memory's own location snapshot; ids don't travel.
        let location: BackupLocation | null = null;
        if (timeMemory.locationId) {
          const row = getLocationById(timeMemory.locationId);
          if (row) {
            location = {
              latitude: row.latitude,
              longitude: row.longitude,
              altitude: row.altitude,
            };
          }
        }

        const media: BackupMedia[] = [];
        for (const item of getTimeMemoryMediaByTimeMemoryId(timeMemory.id)) {
          const zipPath = await stageMedia(
            item.mediaUri,
            item.mediaType,
            item.mediaLibraryAssetId,
          );
          if (zipPath) {
            media.push({ zipPath, mediaType: item.mediaType });
          }
        }

        timeMemories.push({
          timeOfRecord: timeMemory.timeOfRecord,
          summary: timeMemory.summary,
          createdAt: timeMemory.createdAt,
          lastUpdatedTime: timeMemory.lastUpdatedTime,
          location,
          media,
          questionnaire: getTimeMemoryQAByTimeMemoryId(timeMemory.id).map(
            (qa) => ({ question: qa.question, answer: qa.answer }),
          ),
        });
      }

      dayMemories.push({
        day: dayMemory.day,
        summary: dayMemory.summary,
        createdAt: dayMemory.createdAt,
        lastUpdatedTime: dayMemory.lastUpdatedTime,
        timeMemories,
      });
    }

    const settings = getLocationSettingsByUserId(userId);

    const data: BackupData = {
      user: {
        username: profile.username,
        profileImagePath: profileImageZipPath,
        preferredLoginMethod: profile.preferredLoginMethod,
      },
      locationSettings: settings
        ? {
            fetchFrequency: settings.fetchFrequency,
            notificationThreshold: settings.notificationThreshold,
            restThreshold: settings.restThreshold,
            locationTrackingPollFrequency:
              settings.locationTrackingPollFrequency,
          }
        : null,
      locations: getAllLocationsByUserId(userId).map((row) => ({
        latitude: row.latitude,
        longitude: row.longitude,
        altitude: row.altitude,
        createdDateTime: row.createdDateTime,
      })),
      notifications: getNotificationsByUserId(userId).map((row) => ({
        notificationMessage: row.notificationMessage,
        createdAt: row.createdAt,
      })),
      dayMemories,
    };

    const manifest: BackupManifest = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    };

    const manifestFile = new File(stagingDir, MANIFEST_NAME);
    manifestFile.create();
    manifestFile.write(JSON.stringify(manifest, null, 2));

    const dataFile = new File(stagingDir, DATA_NAME);
    dataFile.create();
    dataFile.write(JSON.stringify(data));

    // Note: credentials (SecureStore `login.*`) are deliberately never written
    // here — a backup file shouldn't be able to leak a password.

    const stamp = new Date().toISOString().slice(0, 10);
    const zipTarget = new File(Paths.cache, `journal-backup-${stamp}.zip`);
    try {
      if (zipTarget.exists) zipTarget.delete();
    } catch (error) {
      console.warn("Failed to clear previous export zip:", error);
    }

    const zipPath = await zip(toPath(stagingDir.uri), toPath(zipTarget.uri));
    console.log(
      `Export complete: ${mediaCounter} media staged, ${skippedMedia} skipped, zip at ${zipPath}`,
    );

    return zipTarget.uri;
  } finally {
    cleanUp(stagingDir);
  }
};

// ===== IMPORT =====

const readJson = async <T>(file: File): Promise<T> => {
  const text = await file.text();
  return JSON.parse(text) as T;
};

// Restores a media file from the archive onto this device, producing a brand
// new device-local uri. The archive's own path is never reused.
const restoreMedia = async (
  extractedDir: Directory,
  entry: BackupMedia,
): Promise<{ uri: string; mediaLibraryAssetId: string | null } | null> => {
  const source = new File(extractedDir, entry.zipPath);
  if (!source.exists) {
    console.warn(`Backup references missing media: ${entry.zipPath}`);
    return null;
  }

  try {
    if (entry.mediaType === "video")
      return await saveVideoPersistently(source.uri);
    if (entry.mediaType === "audio")
      return await saveAudioPersistently(source.uri);
    return await saveImagePersistently(source.uri);
  } catch (error) {
    console.warn(`Failed to restore media ${entry.zipPath}:`, error);
    return null;
  }
};

const writeTimeMemoryChildren = async (
  timeMemoryId: number,
  extractedDir: Directory,
  timeMemory: BackupTimeMemory,
) => {
  for (const entry of timeMemory.media) {
    const restored = await restoreMedia(extractedDir, entry);
    if (restored) {
      createTimeMemoryMedia(
        timeMemoryId,
        restored.uri,
        entry.mediaType,
        restored.mediaLibraryAssetId,
      );
    }
  }
  for (const qa of timeMemory.questionnaire) {
    createTimeMemoryQA(timeMemoryId, qa.question, qa.answer);
  }
};

// Replaces a time memory's media + QA rows wholesale, clearing old files first
// (mirrors the edit-save flow in app/(memories)/readoreditmemory.tsx).
const replaceTimeMemoryChildren = async (
  timeMemoryId: number,
  extractedDir: Directory,
  timeMemory: BackupTimeMemory,
) => {
  const oldMedia = getTimeMemoryMediaByTimeMemoryId(timeMemoryId);
  await Promise.all(
    oldMedia.map((item) =>
      deleteMedia(item.mediaUri, item.mediaType).catch((error) => {
        console.warn(`Failed to delete media file ${item.mediaUri}:`, error);
      }),
    ),
  );
  deleteTimeMemoryMediaByTimeMemoryId(timeMemoryId);
  deleteTimeMemoryQAByTimeMemoryId(timeMemoryId);

  await writeTimeMemoryChildren(timeMemoryId, extractedDir, timeMemory);
};

// Resolves which user this import targets, creating one if the device is
// blank. Returns null if a *different* user is already registered — this app
// is single-user everywhere else, so import shouldn't invent a second account.
const resolveImportUserId = (username: string): number | null => {
  const existingId = getRegisteredUserId();
  if (existingId === null) {
    return insertUserIntoDB(username);
  }
  const matchingId = getUserIdByUsername(username);
  return matchingId === existingId ? existingId : null;
};

export const applyImportZip = async (zipUri: string): Promise<void> => {
  const extractedDir = await makeStagingDir("backup-import");

  try {
    await unzip(toPath(zipUri), toPath(extractedDir.uri));

    const manifestFile = new File(extractedDir, MANIFEST_NAME);
    const dataFile = new File(extractedDir, DATA_NAME);
    if (!manifestFile.exists || !dataFile.exists) {
      throw new Error("This file doesn't look like a journal backup");
    }

    const manifest = await readJson<BackupManifest>(manifestFile);
    if (manifest.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `Backup version ${manifest.schemaVersion} isn't supported by this app version`,
      );
    }

    const data = await readJson<BackupData>(dataFile);

    const userId = resolveImportUserId(data.user.username);
    if (userId === null) {
      throw new Error(
        `This backup belongs to "${data.user.username}", but a different account is already set up on this device`,
      );
    }

    // --- User profile ---
    if (data.user.preferredLoginMethod) {
      setUserPreferredLoginMethod(userId, data.user.preferredLoginMethod);
    }
    if (data.user.profileImagePath) {
      const source = new File(extractedDir, data.user.profileImagePath);
      if (source.exists) {
        try {
          setUserProfileImagePath(userId, await saveProfilePicture(source.uri));
        } catch (error) {
          console.warn("Failed to restore profile picture:", error);
        }
      }
    }

    // --- Location settings ---
    if (data.locationSettings) {
      const s = data.locationSettings;
      if (getLocationSettingsByUserId(userId)) {
        updateLocationSettings(
          userId,
          s.fetchFrequency,
          s.notificationThreshold,
          s.restThreshold,
          s.locationTrackingPollFrequency,
        );
      } else {
        createLocationSettings(
          userId,
          s.fetchFrequency,
          s.notificationThreshold,
          s.restThreshold,
          s.locationTrackingPollFrequency,
        );
      }
    }

    // --- Breadcrumbs & notifications (deduped on their timestamps) ---
    for (const row of data.locations) {
      if (!locationExistsAtTime(userId, row.createdDateTime)) {
        insertLocationForImport(
          userId,
          row.latitude,
          row.longitude,
          row.altitude,
          row.createdDateTime,
        );
      }
    }
    for (const row of data.notifications) {
      if (!notificationExistsAtTime(userId, row.createdAt)) {
        insertNotificationForImport(
          userId,
          row.notificationMessage,
          row.createdAt,
        );
      }
    }

    // --- Memories (last-write-wins on lastUpdatedTime) ---
    let inserted = 0;
    let replaced = 0;
    let skipped = 0;

    for (const dayMemory of data.dayMemories) {
      const existingDay = getDayMemoryByUserIdAndDay(userId, dayMemory.day);
      let dayMemoryId: number;

      if (existingDay) {
        dayMemoryId = existingDay.id;
        const localDay = getDayMemoryById(dayMemoryId);
        if (
          localDay &&
          isNewerThan(dayMemory.lastUpdatedTime, localDay.lastUpdatedTime)
        ) {
          updateDayMemoryForImport(
            dayMemoryId,
            dayMemory.summary,
            dayMemory.lastUpdatedTime,
          );
        }
      } else {
        dayMemoryId = createDayMemoryForImport(
          userId,
          dayMemory.day,
          dayMemory.summary,
          dayMemory.createdAt,
          dayMemory.lastUpdatedTime,
        );
      }

      for (const timeMemory of dayMemory.timeMemories) {
        const existing = getTimeMemoryByDayMemoryIdAndTime(
          dayMemoryId,
          timeMemory.timeOfRecord,
        );

        // Local copy is same-or-newer: leave it alone. Checked before writing
        // anything, so a skipped memory doesn't strand an unused Location row.
        if (
          existing &&
          !isNewerThan(timeMemory.lastUpdatedTime, existing.lastUpdatedTime)
        ) {
          skipped += 1;
          continue;
        }

        // The memory's location snapshot becomes a fresh Location row.
        const locationId = timeMemory.location
          ? insertLocationForImport(
              userId,
              timeMemory.location.latitude,
              timeMemory.location.longitude,
              timeMemory.location.altitude,
              timeMemory.createdAt,
            )
          : null;

        if (!existing) {
          const timeMemoryId = createTimeMemoryForImport(
            dayMemoryId,
            locationId,
            timeMemory.timeOfRecord,
            timeMemory.summary,
            timeMemory.createdAt,
            timeMemory.lastUpdatedTime,
          );
          await writeTimeMemoryChildren(timeMemoryId, extractedDir, timeMemory);
          inserted += 1;
        } else {
          updateTimeMemoryForImport(
            existing.id,
            locationId,
            timeMemory.summary,
            timeMemory.lastUpdatedTime,
          );
          await replaceTimeMemoryChildren(
            existing.id,
            extractedDir,
            timeMemory,
          );
          replaced += 1;
        }
      }
    }

    console.log(
      `Import complete: ${inserted} added, ${replaced} updated, ${skipped} left as-is`,
    );
  } finally {
    cleanUp(extractedDir);
  }
};
