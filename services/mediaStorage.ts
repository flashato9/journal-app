import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  AppPrivateDirectoryPaths,
  ensureDirectoryExists,
  getActiveStorageMode,
  getAppDirectory,
  StorageMode,
} from "@/services/filesystem";
import type { MediaType } from "@/types/media";

export type { MediaType };

// Result of persisting a media file. `mediaLibraryAssetId` is only populated
// for gallery-stored (production) images/videos — it's what lets a later export
// resolve the real file bytes, since a gallery uri isn't always readable
// directly (iOS returns a `ph://` reference, not a file path).
export interface SavedMedia {
  uri: string;
  mediaLibraryAssetId: string | null;
}

// Save image to gallery (production) or local app storage (development)
export const saveImagePersistently = async (
  temporaryUri: string,
): Promise<SavedMedia> => {
  try {
    if (getActiveStorageMode() === StorageMode.Gallery) {
      // Production: Save to photo library
      const permission = await MediaLibrary.requestPermissionsAsync(false, [
        "photo",
      ]);
      if (!permission.granted) {
        throw new Error("Photo library permission not granted");
      }

      const asset = await MediaLibrary.createAssetAsync(temporaryUri);
      console.log("Image saved to photo library:", asset.uri);
      return { uri: asset.uri, mediaLibraryAssetId: asset.id };
    } else {
      // Development: Save to app local file system
      const memoriesDir = getAppDirectory(AppPrivateDirectoryPaths.Memories);
      await ensureDirectoryExists(memoriesDir);
      const fileName = `photo_${Date.now()}.jpg`;
      const targetUri = `${memoriesDir.uri}/${fileName}`;

      // Copy temporary image to memories directory
      const file = new File(temporaryUri);
      const targetFile = new File(targetUri);
      await file.copy(targetFile);

      console.log("Image saved to local app storage:", targetUri);
      return { uri: targetUri, mediaLibraryAssetId: null };
    }
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
};

// Save video to gallery (production) or local app storage (development) —
// mirrors saveImagePersistently, kept separate rather than parametrizing it
// since the permission scope, target directory, and filename all differ.
export const saveVideoPersistently = async (
  temporaryUri: string,
): Promise<SavedMedia> => {
  try {
    if (getActiveStorageMode() === StorageMode.Gallery) {
      // Production: Save to photo library
      const permission = await MediaLibrary.requestPermissionsAsync(false, [
        "video",
      ]);
      if (!permission.granted) {
        throw new Error("Photo library permission not granted");
      }

      const asset = await MediaLibrary.createAssetAsync(temporaryUri);
      console.log("Video saved to photo library:", asset.uri);
      return { uri: asset.uri, mediaLibraryAssetId: asset.id };
    } else {
      // Development: Save to app local file system
      const videosDir = getAppDirectory(AppPrivateDirectoryPaths.VideoMemories);
      await ensureDirectoryExists(videosDir);
      const fileName = `video_${Date.now()}.mp4`;
      const targetUri = `${videosDir.uri}/${fileName}`;

      // Copy temporary video to videos directory
      const file = new File(temporaryUri);
      const targetFile = new File(targetUri);
      await file.copy(targetFile);

      console.log("Video saved to local app storage:", targetUri);
      return { uri: targetUri, mediaLibraryAssetId: null };
    }
  } catch (error) {
    console.error("Error saving video:", error);
    throw error;
  }
};

// Save a sound recording. Unlike images/videos this ignores StorageMode and is
// always app-private: recordings don't belong in the OS photo library, and iOS
// wouldn't surface them there anyway.
export const saveAudioPersistently = async (
  temporaryUri: string,
): Promise<SavedMedia> => {
  try {
    const soundsDir = getAppDirectory(AppPrivateDirectoryPaths.AudioMemories);
    await ensureDirectoryExists(soundsDir);
    const fileName = `sound_${Date.now()}.m4a`;
    const targetUri = `${soundsDir.uri}/${fileName}`;

    // Copy the recorder's temporary output into the sounds directory
    const file = new File(temporaryUri);
    const targetFile = new File(targetUri);
    await file.copy(targetFile);

    console.log("Audio saved to local app storage:", targetUri);
    // Always app-private, so there's never a media-library asset id.
    return { uri: targetUri, mediaLibraryAssetId: null };
  } catch (error) {
    console.error("Error saving audio:", error);
    throw error;
  }
};

// Resolve a stored media item to a readable local file path, for export.
//
// A gallery uri isn't reliably readable on its own (iOS hands back a `ph://`
// reference), so when we have an asset id we ask MediaLibrary to resolve the
// real path. Everything else — app-private dev media, all audio, and Android
// gallery uris, which are already `file://` paths — is read directly.
// Returns null when the bytes can't be reached, so export can skip the item
// instead of aborting the whole backup.
export const resolveReadableMediaUri = async (
  mediaUri: string,
  mediaLibraryAssetId: string | null,
): Promise<string | null> => {
  if (mediaLibraryAssetId) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(mediaLibraryAssetId);
      if (info?.localUri) return info.localUri;
      console.warn(
        `Asset ${mediaLibraryAssetId} has no localUri; falling back to stored uri`,
      );
    } catch (error) {
      console.warn(
        `Failed to resolve media library asset ${mediaLibraryAssetId}:`,
        error,
      );
    }
  }

  // No asset id (or resolving it failed): the stored uri is only usable if it's
  // an actual file path. A `ph://` reference here can't be read, so bail.
  if (mediaUri.startsWith("ph://")) {
    console.warn(
      `Cannot read iOS gallery media without an asset id: ${mediaUri}`,
    );
    return null;
  }
  return mediaUri;
};

// Read a stored media item's raw bytes, for writing into a backup archive.
// Returns null when the item can't be read (see resolveReadableMediaUri).
export const readMediaBytes = async (
  mediaUri: string,
  mediaLibraryAssetId: string | null,
): Promise<Uint8Array | null> => {
  const readableUri = await resolveReadableMediaUri(
    mediaUri,
    mediaLibraryAssetId,
  );
  if (!readableUri) return null;

  try {
    const file = new File(readableUri);
    if (!file.exists) {
      console.warn(`Media file missing on disk, skipping: ${readableUri}`);
      return null;
    }
    return await file.bytes();
  } catch (error) {
    console.warn(`Failed to read media bytes for ${readableUri}:`, error);
    return null;
  }
};

// Delete a media file. Audio is always a local file; images/videos live in the
// photo library in production, so deleting those has to go through MediaLibrary.
export const deleteMedia = async (
  uri: string,
  type: MediaType,
): Promise<void> => {
  try {
    if (type !== "audio" && getActiveStorageMode() === StorageMode.Gallery) {
      // Production: Delete from photo library
      await MediaLibrary.deleteAssetsAsync([uri]);
      console.log("Media deleted from photo library:", uri);
    } else {
      // Development, or any sound recording: Delete from local app storage
      const file = new File(uri);
      await file.delete();
      console.log("Media deleted from local app storage:", uri);
    }
  } catch (error) {
    console.error("Error deleting media:", error);
    throw error;
  }
};
