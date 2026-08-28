import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as SQLite from "expo-sqlite";
import { logError, logInfo, logWarn } from "@/services/appLogger";
import migrations from "./migrations/migrations";

const DATABASE_NAME = "journal.db";

const expo = SQLite.openDatabaseSync(DATABASE_NAME);
expo.execSync("PRAGMA busy_timeout = 5000;");
try {
  expo.execSync("PRAGMA journal_mode = WAL;");
} catch (error) {
  logWarn("Could not enable WAL mode (will retry on next launch):", error);
}
export const db = drizzle(expo);

// DrizzleError wraps the real driver error in .cause, which logError's
// default arg formatting doesn't unwrap on its own.
function logDatabaseInitError(error: unknown): void {
  logError("Error initializing database:", error);
  if (error instanceof Error && error.cause) {
    logError("Error initializing database (cause):", error.cause);
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    await migrate(db, migrations);
    logInfo("Database initialized successfully");
  } catch (error) {
    logDatabaseInitError(error);
  }
}

export function deleteDatabase(): void {
  expo.closeSync();
  SQLite.deleteDatabaseSync(DATABASE_NAME);
}
