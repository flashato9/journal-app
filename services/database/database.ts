import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as SQLite from "expo-sqlite";
import migrations from "./migrations/migrations";

const DATABASE_NAME = "journal.db";

const expo = SQLite.openDatabaseSync(DATABASE_NAME);
expo.execSync("PRAGMA busy_timeout = 5000;");
try {
  expo.execSync("PRAGMA journal_mode = WAL;");
} catch (error) {
  console.warn("Could not enable WAL mode (will retry on next launch):", error);
}
export const db = drizzle(expo);

export async function initializeDatabase(): Promise<void> {
  try {
    await migrate(db, migrations);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export function deleteDatabase(): void {
  expo.closeSync();
  SQLite.deleteDatabaseSync(DATABASE_NAME);
}
