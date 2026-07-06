import * as SQLite from "expo-sqlite";

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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    // Create TimeMemoryImage table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS TimeMemoryImage (
        id INTEGER PRIMARY KEY,
        timeMemoryId INTEGER NOT NULL,
        imageUri TEXT NOT NULL,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(timeMemoryId) REFERENCES TimeMemory(id)
      );
    `);

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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdatedTime TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES User(id)
      );
    `);

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

export const getUserIdByUsername = (username: string): number | null => {
  const result = db.getFirstSync<{ id: number }>(
    "SELECT id FROM User WHERE username = ?",
    [username],
  );
  return result?.id || null;
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

export const createTimeMemoryImage = (
  timeMemoryId: number,
  imageUri: string,
): number => {
  const result = db.runSync(
    "INSERT INTO TimeMemoryImage (timeMemoryId, imageUri) VALUES (?, ?)",
    [timeMemoryId, imageUri],
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

interface TimeMemoryImage {
  id: number;
  timeMemoryId: number;
  imageUri: string;
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

export const getTimeMemoryImagesByTimeMemoryId = (
  timeMemoryId: number,
): TimeMemoryImage[] => {
  const result = db.getAllSync<TimeMemoryImage>(
    "SELECT * FROM TimeMemoryImage WHERE timeMemoryId = ?",
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

export const deleteTimeMemoryImagesByTimeMemoryId = (
  timeMemoryId: number,
): void => {
  db.runSync("DELETE FROM TimeMemoryImage WHERE timeMemoryId = ?", [
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
  notificationMessage: string,
): { id: number; createdAt: string } | null => {
  const result = db.getFirstSync<{ id: number; createdAt: string }>(
    `SELECT id, createdAt FROM Notification 
     WHERE userId = ? AND notificationMessage = ? 
     ORDER BY createdAt DESC LIMIT 1`,
    [userId, notificationMessage],
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
  createdAt: string;
  lastUpdatedTime: string;
} | null => {
  const result = db.getFirstSync<{
    id: number;
    userId: number;
    fetchFrequency: number;
    notificationThreshold: number;
    restThreshold: number;
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
): number => {
  const result = db.runSync(
    "INSERT INTO LocationSettings (userId, fetchFrequency, notificationThreshold, restThreshold, createdAt, lastUpdatedTime) VALUES (?, ?, ?, ?, ?, ?)",
    [
      userId,
      fetchFrequency,
      notificationThreshold,
      restThreshold,
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
): void => {
  db.runSync(
    "UPDATE LocationSettings SET fetchFrequency = ?, notificationThreshold = ?, restThreshold = ?, lastUpdatedTime = ? WHERE userId = ?",
    [
      fetchFrequency,
      notificationThreshold,
      restThreshold,
      new Date().toISOString(),
      userId,
    ],
  );
};
