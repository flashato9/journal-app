import * as SQLite from "expo-sqlite";
// Type-only import: erased at compile time, so this doesn't pull the storage
// module (and expo-media-library with it) into the database module graph.
import type { MediaType } from "@/services/mediaStorage";

const DATABASE_NAME = "journal.db";

// Open/create database
export const db = SQLite.openDatabaseSync(DATABASE_NAME);

// Initialize tables
export const initializeDatabase = async () => {
  try {
    // Create User table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        profileImagePath TEXT,
        preferredLoginMethod TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing databases created before profileImagePath existed
    try {
      db.execSync(`ALTER TABLE User ADD COLUMN profileImagePath TEXT;`);
    } catch {
      // Column already exists — ignore
    }

    // Migrate existing databases created before preferredLoginMethod existed
    try {
      db.execSync(`ALTER TABLE User ADD COLUMN preferredLoginMethod TEXT;`);
    } catch {
      // Column already exists — ignore
    }

    // Create DayMemory table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS DayMemory (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL,
        day TEXT NOT NULL,
        summary TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES User(id)
      );
    `);

    // Create Location table (MUST be before TimeMemory since TimeMemory references it)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Location (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        createdDateTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES User(id)
      );
    `);

    // Create TimeMemory table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS TimeMemory (
        id INTEGER PRIMARY KEY,
        dayMemoryId INTEGER NOT NULL,
        locationId INTEGER,
        timeOfRecord TEXT NOT NULL,
        summary TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dayMemoryId) REFERENCES DayMemory(id),
        FOREIGN KEY(locationId) REFERENCES Location(id)
      );
    `);

    // Migrate databases created back when this table only held images.
    // Ordering matters: rename the table first so the column migrations below
    // always target TimeMemoryMedia. Each step no-ops on databases that are
    // already current.
    try {
      db.execSync(`ALTER TABLE TimeMemoryImage RENAME TO TimeMemoryMedia;`);
    } catch {
      // Table already renamed, or this is a fresh install — ignore
    }

    // Create TimeMemoryMedia table (images, videos, and sound recordings)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS TimeMemoryMedia (
        id INTEGER PRIMARY KEY,
        timeMemoryId INTEGER NOT NULL,
        mediaUri TEXT NOT NULL,
        mediaType TEXT NOT NULL DEFAULT 'image',
        mediaLibraryAssetId TEXT,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(timeMemoryId) REFERENCES TimeMemory(id)
      );
    `);

    // Migrate existing databases created before mediaType existed
    try {
      db.execSync(
        `ALTER TABLE TimeMemoryMedia ADD COLUMN mediaType TEXT NOT NULL DEFAULT 'image';`,
      );
    } catch {
      // Column already exists — ignore
    }

    // Migrate existing databases created before imageUri became mediaUri
    try {
      db.execSync(
        `ALTER TABLE TimeMemoryMedia RENAME COLUMN imageUri TO mediaUri;`,
      );
    } catch {
      // Column already renamed, or this is a fresh install — ignore
    }

    // Migrate existing databases created before mediaLibraryAssetId existed.
    // Nullable: only gallery-stored (production) media has an asset id; rows
    // predating this column keep NULL and fall back to reading mediaUri directly.
    try {
      db.execSync(
        `ALTER TABLE TimeMemoryMedia ADD COLUMN mediaLibraryAssetId TEXT;`,
      );
    } catch {
      // Column already exists — ignore
    }

    // Create TimeMemoryQA table (Question & Answer)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS TimeMemoryQA (
        id INTEGER PRIMARY KEY,
        timeMemoryId INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(timeMemoryId) REFERENCES TimeMemory(id)
      );
    `);

    // Create Notification table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Notification (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL,
        notificationMessage TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES User(id)
      );
    `);

    // Create LocationSettings table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS LocationSettings (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL UNIQUE,
        fetchFrequency INTEGER DEFAULT 10,
        notificationThreshold REAL DEFAULT 1,
        restThreshold INTEGER DEFAULT 10,
        locationTrackingPollFrequency INTEGER DEFAULT 15,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES User(id)
      );
    `);

    // Migrate existing databases created before locationTrackingPollFrequency existed
    try {
      db.execSync(
        `ALTER TABLE LocationSettings ADD COLUMN locationTrackingPollFrequency INTEGER DEFAULT 15;`,
      );
    } catch {
      // Column already exists — ignore
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// ===== USER OPERATIONS =====

export const isUserExists = (username: string): boolean => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM User WHERE username = ?",
    [username],
  );
  return !!result;
};

export const insertUserIntoDB = (username: string): number => {
  const result = db.runSync("INSERT INTO User (username) VALUES (?)", [
    username,
  ]);
  return result.lastInsertRowId;
};

export const setUserPreferredLoginMethod = (
  userId: number,
  preferredLoginMethod: string,
): void => {
  db.runSync("UPDATE User SET preferredLoginMethod = ? WHERE id = ?", [
    preferredLoginMethod,
    userId,
  ]);
};

export const setUserProfileImagePath = (
  userId: number,
  profileImagePath: string,
): void => {
  db.runSync("UPDATE User SET profileImagePath = ? WHERE id = ?", [
    profileImagePath,
    userId,
  ]);
};

export const updateUsername = (userId: number, newUsername: string): void => {
  db.runSync("UPDATE User SET username = ? WHERE id = ?", [
    newUsername,
    userId,
  ]);
};

export const getUserIdByUsername = (username: string): number | null => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM User WHERE username = ?",
    [username],
  );
  return result?.id || null;
};

export const isUserRegistered = (): boolean => {
  const result = db.getFirstSync<{ id: number }>("SELECT id FROM User");
  return !!result;
};

export const getRegisteredUserId = (): number | null => {
  const result = db.getFirstSync<{ id: number }>("SELECT id FROM User LIMIT 1");
  return result?.id ?? null;
};

export const getUserProfile = (
  id: number,
): {
  username: string;
  profileImagePath: string | null;
  preferredLoginMethod: string | null;
} | null => {
  const result = db.getFirstSync<{
    username: string;
    profileImagePath: string | null;
    preferredLoginMethod: string | null;
  }>(
    "SELECT username, profileImagePath, preferredLoginMethod FROM User WHERE id = ?",
    [id],
  );
  return result ?? null;
};

// ===== DAY MEMORY OPERATIONS =====

interface DayMemoryRecord {
  id: number;
  userId: number;
  day: string;
  summary: string;
  createdAt: string;
  lastUpdatedTime: string;
}

export const getDayMemoriesByUserId = (userId: number): DayMemoryRecord[] => {
  const result = db.getAllSync<DayMemoryRecord>(
    "SELECT * FROM DayMemory WHERE userId = ? ORDER BY day DESC",
    [userId],
  );
  return result || [];
};
export const isDayMemoryExists = (userId: number, day: string): boolean => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM DayMemory WHERE userId = ? AND day = ?",
    [userId, day],
  );
  return !!result;
};

export const createDayMemory = (
  userId: number,
  day: string,
  summary: string = "Summary TBD",
): number => {
  const result = db.runSync(
    "INSERT INTO DayMemory (userId, day, summary) VALUES (?, ?, ?)",
    [userId, day, summary],
  );
  return result.lastInsertRowId;
};

export const getDayMemoryById = (
  dayMemoryId: number,
): DayMemoryRecord | null => {
  const result = db.getFirstSync<DayMemoryRecord>(
    "SELECT * FROM DayMemory WHERE id = ?",
    [dayMemoryId],
  );
  return result || null;
};

export const updateDayMemory = (dayMemoryId: number, summary: string): void => {
  db.runSync("UPDATE DayMemory SET summary = ? WHERE id = ?", [
    summary,
    dayMemoryId,
  ]);
};

// ===== TIME MEMORY OPERATIONS =====

interface TimeMemoryRecord {
  id: number;
  dayMemoryId: number;
  locationId: number | null;
  timeOfRecord: string;
  summary: string;
  createdAt: string;
  lastUpdatedTime: string;
}

export const getTimeMemoriesByDayMemoryId = (
  dayMemoryId: number,
): TimeMemoryRecord[] => {
  const result = db.getAllSync<TimeMemoryRecord>(
    "SELECT * FROM TimeMemory WHERE dayMemoryId = ? ORDER BY timeOfRecord DESC",
    [dayMemoryId],
  );
  return result || [];
};

export const getDayMemoryByUserIdAndDay = (
  userId: number,
  day: string,
): { id: number } | null => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM DayMemory WHERE userId = ? AND day = ?",
    [userId, day],
  );
  return result || null;
};

export const createTimeMemory = (
  dayMemoryId: number,
  timeOfRecord: string,
  summary: string,
  locationId?: number,
): number => {
  const result = db.runSync(
    "INSERT INTO TimeMemory (dayMemoryId, locationId, timeOfRecord, summary) VALUES (?, ?, ?, ?)",
    [dayMemoryId, locationId || null, timeOfRecord, summary],
  );
  return result.lastInsertRowId;
};

export const createTimeMemoryMedia = (
  timeMemoryId: number,
  mediaUri: string,
  mediaType: MediaType = "image",
  mediaLibraryAssetId: string | null = null,
): number => {
  const result = db.runSync(
    "INSERT INTO TimeMemoryMedia (timeMemoryId, mediaUri, mediaType, mediaLibraryAssetId) VALUES (?, ?, ?, ?)",
    [timeMemoryId, mediaUri, mediaType, mediaLibraryAssetId],
  );
  return result.lastInsertRowId;
};

export const createTimeMemoryQA = (
  timeMemoryId: number,
  question: string,
  answer: string,
): number => {
  const result = db.runSync(
    "INSERT INTO TimeMemoryQA (timeMemoryId, question, answer) VALUES (?, ?, ?)",
    [timeMemoryId, question, answer],
  );
  return result.lastInsertRowId;
};

// ===== GET TIME MEMORY DETAILS =====

export interface TimeMemoryMedia {
  id: number;
  timeMemoryId: number;
  mediaUri: string;
  mediaType: MediaType;
  // Only set for media saved to the OS gallery (production). Needed to resolve
  // the real file bytes for export, since a gallery uri isn't always readable.
  mediaLibraryAssetId: string | null;
}

interface TimeMemoryQA {
  id: number;
  timeMemoryId: number;
  question: string;
  answer: string;
}

export const getTimeMemoryById = (
  timeMemoryId: number,
): TimeMemoryRecord | null => {
  const result = db.getFirstSync<TimeMemoryRecord>(
    "SELECT * FROM TimeMemory WHERE id = ?",
    [timeMemoryId],
  );
  return result || null;
};

export const getTimeMemoryMediaByTimeMemoryId = (
  timeMemoryId: number,
): TimeMemoryMedia[] => {
  const result = db.getAllSync<TimeMemoryMedia>(
    "SELECT * FROM TimeMemoryMedia WHERE timeMemoryId = ?",
    [timeMemoryId],
  );
  return result || [];
};

export const getTimeMemoryQAByTimeMemoryId = (
  timeMemoryId: number,
): TimeMemoryQA[] => {
  const result = db.getAllSync<TimeMemoryQA>(
    "SELECT * FROM TimeMemoryQA WHERE timeMemoryId = ?",
    [timeMemoryId],
  );
  return result || [];
};

// ===== UPDATE TIME MEMORY DETAILS =====

export const updateTimeMemory = (
  timeMemoryId: number,
  summary: string,
): void => {
  db.runSync(
    "UPDATE TimeMemory SET summary = ?, lastUpdatedTime = ? WHERE id = ?",
    [summary, new Date().toISOString(), timeMemoryId],
  );
};

export const deleteTimeMemoryMediaByTimeMemoryId = (
  timeMemoryId: number,
): void => {
  db.runSync("DELETE FROM TimeMemoryMedia WHERE timeMemoryId = ?", [
    timeMemoryId,
  ]);
};

export const deleteTimeMemoryQAByTimeMemoryId = (
  timeMemoryId: number,
): void => {
  db.runSync("DELETE FROM TimeMemoryQA WHERE timeMemoryId = ?", [timeMemoryId]);
};

// ===== LOCATION OPERATIONS =====

export const insertLocation = (
  userId: number,
  latitude: number,
  longitude: number,
  altitude: number | null,
): number => {
  const result = db.runSync(
    "INSERT INTO Location (userId, latitude, longitude, altitude, createdDateTime) VALUES (?, ?, ?, ?, ?)",
    [userId, latitude, longitude, altitude, new Date().toISOString()],
  );
  return result.lastInsertRowId;
};

export const getLocationsByUserId = (userId: number, limit: number = 100) => {
  const result = db.getAllSync(
    "SELECT * FROM Location WHERE userId = ? ORDER BY createdDateTime DESC LIMIT ?",
    [userId, limit],
  );
  return result || [];
};

export const getLocationById = (
  locationId: number,
): {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  createdDateTime: string;
} | null => {
  const result = db.getFirstSync<{
    id: number;
    userId: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    createdDateTime: string;
  }>("SELECT * FROM Location WHERE id = ?", [locationId]);
  return result || null;
};

// ===== LATEST LOCATION QUERY =====

export const getLatestLocation = (
  userId: number,
): {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  createdDateTime: string;
} | null => {
  const result = db.getFirstSync<{
    id: number;
    userId: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    createdDateTime: string;
  }>(
    "SELECT * FROM Location WHERE userId = ? ORDER BY createdDateTime DESC LIMIT 1",
    [userId],
  );
  return result || null;
};

// ===== LATEST TIME MEMORY WITH LOCATION =====

export const getLatestTimeMemoryWithLocation = (
  userId: number,
): {
  timeMemoryId: number;
  locationId: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
} | null => {
  const result = db.getFirstSync<{
    timeMemoryId: number;
    locationId: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
  }>(
    `SELECT 
      tm.id as timeMemoryId,
      tm.locationId,
      l.latitude,
      l.longitude,
      tm.createdAt
    FROM TimeMemory tm
    LEFT JOIN Location l ON tm.locationId = l.id
    WHERE tm.dayMemoryId IN (
      SELECT id FROM DayMemory WHERE userId = ?
    )
    ORDER BY tm.createdAt DESC LIMIT 1`,
    [userId],
  );
  return result || null;
};

// ===== NOTIFICATION OPERATIONS =====

export const insertNotification = (
  userId: number,
  notificationMessage: string,
): number => {
  const result = db.runSync(
    "INSERT INTO Notification (userId, notificationMessage, createdAt) VALUES (?, ?, ?)",
    [userId, notificationMessage, new Date().toISOString()],
  );
  return result.lastInsertRowId;
};

export const getLatestNotification = (
  userId: number,
): { id: number; createdAt: string } | null => {
  const result = db.getFirstSync<{ id: number; createdAt: string }>(
    `SELECT id, createdAt FROM Notification
     WHERE userId = ?
     ORDER BY createdAt DESC LIMIT 1`,
    [userId],
  );
  return result || null;
};

// ===== LOCATION SETTINGS OPERATIONS =====

export const getLocationSettingsByUserId = (
  userId: number,
): {
  id: number;
  userId: number;
  fetchFrequency: number;
  notificationThreshold: number;
  restThreshold: number;
  locationTrackingPollFrequency: number;
  createdAt: string;
  lastUpdatedTime: string;
} | null => {
  const result = db.getFirstSync<{
    id: number;
    userId: number;
    fetchFrequency: number;
    notificationThreshold: number;
    restThreshold: number;
    locationTrackingPollFrequency: number;
    createdAt: string;
    lastUpdatedTime: string;
  }>("SELECT * FROM LocationSettings WHERE userId = ?", [userId]);
  return result || null;
};

export const createLocationSettings = (
  userId: number,
  fetchFrequency: number = 10,
  notificationThreshold: number = 1,
  restThreshold: number = 10,
  locationTrackingPollFrequency: number = 15,
): number => {
  const result = db.runSync(
    "INSERT INTO LocationSettings (userId, fetchFrequency, notificationThreshold, restThreshold, locationTrackingPollFrequency, createdAt, lastUpdatedTime) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      fetchFrequency,
      notificationThreshold,
      restThreshold,
      locationTrackingPollFrequency,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
};

export const updateLocationSettings = (
  userId: number,
  fetchFrequency: number,
  notificationThreshold: number,
  restThreshold: number,
  locationTrackingPollFrequency: number,
): void => {
  db.runSync(
    "UPDATE LocationSettings SET fetchFrequency = ?, notificationThreshold = ?, restThreshold = ?, locationTrackingPollFrequency = ?, lastUpdatedTime = ? WHERE userId = ?",
    [
      fetchFrequency,
      notificationThreshold,
      restThreshold,
      locationTrackingPollFrequency,
      new Date().toISOString(),
      userId,
    ],
  );
};

// ===== BACKUP EXPORT/IMPORT OPERATIONS =====
//
// Export needs the *full* history (the read helpers above are capped or scoped
// for UI use). Import needs to write rows with their original timestamps rather
// than stamping "now", so that re-importing the same backup is a no-op under
// last-write-wins instead of looking newer every time.

export interface LocationRecord {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  createdDateTime: string;
}

export interface NotificationRecord {
  id: number;
  userId: number;
  notificationMessage: string;
  createdAt: string;
}

// Unlike getLocationsByUserId (capped at 100 for the UI), this returns the
// whole breadcrumb trail for a complete snapshot.
export const getAllLocationsByUserId = (userId: number): LocationRecord[] => {
  const result = db.getAllSync<LocationRecord>(
    "SELECT * FROM Location WHERE userId = ? ORDER BY createdDateTime ASC",
    [userId],
  );
  return result || [];
};

export const getNotificationsByUserId = (
  userId: number,
): NotificationRecord[] => {
  const result = db.getAllSync<NotificationRecord>(
    "SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt ASC",
    [userId],
  );
  return result || [];
};

// Natural-key lookup: autoincrement ids are per-device, so import matches an
// existing memory by the day it belongs to plus its capture time.
export const getTimeMemoryByDayMemoryIdAndTime = (
  dayMemoryId: number,
  timeOfRecord: string,
): TimeMemoryRecord | null => {
  const result = db.getFirstSync<TimeMemoryRecord>(
    "SELECT * FROM TimeMemory WHERE dayMemoryId = ? AND timeOfRecord = ?",
    [dayMemoryId, timeOfRecord],
  );
  return result || null;
};

export const locationExistsAtTime = (
  userId: number,
  createdDateTime: string,
): boolean => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM Location WHERE userId = ? AND createdDateTime = ?",
    [userId, createdDateTime],
  );
  return !!result;
};

export const notificationExistsAtTime = (
  userId: number,
  createdAt: string,
): boolean => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM Notification WHERE userId = ? AND createdAt = ?",
    [userId, createdAt],
  );
  return !!result;
};

export const insertLocationForImport = (
  userId: number,
  latitude: number,
  longitude: number,
  altitude: number | null,
  createdDateTime: string,
): number => {
  const result = db.runSync(
    "INSERT INTO Location (userId, latitude, longitude, altitude, createdDateTime) VALUES (?, ?, ?, ?, ?)",
    [userId, latitude, longitude, altitude, createdDateTime],
  );
  return result.lastInsertRowId;
};

export const insertNotificationForImport = (
  userId: number,
  notificationMessage: string,
  createdAt: string,
): number => {
  const result = db.runSync(
    "INSERT INTO Notification (userId, notificationMessage, createdAt) VALUES (?, ?, ?)",
    [userId, notificationMessage, createdAt],
  );
  return result.lastInsertRowId;
};

export const createDayMemoryForImport = (
  userId: number,
  day: string,
  summary: string,
  createdAt: string,
  lastUpdatedTime: string,
): number => {
  const result = db.runSync(
    "INSERT INTO DayMemory (userId, day, summary, createdAt, lastUpdatedTime) VALUES (?, ?, ?, ?, ?)",
    [userId, day, summary, createdAt, lastUpdatedTime],
  );
  return result.lastInsertRowId;
};

export const updateDayMemoryForImport = (
  dayMemoryId: number,
  summary: string,
  lastUpdatedTime: string,
): void => {
  db.runSync(
    "UPDATE DayMemory SET summary = ?, lastUpdatedTime = ? WHERE id = ?",
    [summary, lastUpdatedTime, dayMemoryId],
  );
};

export const createTimeMemoryForImport = (
  dayMemoryId: number,
  locationId: number | null,
  timeOfRecord: string,
  summary: string,
  createdAt: string,
  lastUpdatedTime: string,
): number => {
  const result = db.runSync(
    "INSERT INTO TimeMemory (dayMemoryId, locationId, timeOfRecord, summary, createdAt, lastUpdatedTime) VALUES (?, ?, ?, ?, ?, ?)",
    [
      dayMemoryId,
      locationId,
      timeOfRecord,
      summary,
      createdAt,
      lastUpdatedTime,
    ],
  );
  return result.lastInsertRowId;
};

// Unlike updateTimeMemory (which stamps lastUpdatedTime = now), this preserves
// the backup's own timestamp so repeat imports stay idempotent.
export const updateTimeMemoryForImport = (
  timeMemoryId: number,
  locationId: number | null,
  summary: string,
  lastUpdatedTime: string,
): void => {
  db.runSync(
    "UPDATE TimeMemory SET locationId = ?, summary = ?, lastUpdatedTime = ? WHERE id = ?",
    [locationId, summary, lastUpdatedTime, timeMemoryId],
  );
};
