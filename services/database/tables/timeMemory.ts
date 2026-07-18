import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../database";
import {
  timeMemoryTable,
  type NewTimeMemoryRow,
  type TimeMemoryRow,
} from "../schema/timeMemory";

export function createTimeMemoryRow(row: NewTimeMemoryRow): number {
  const result = db.insert(timeMemoryTable).values(row).run();
  const timeMemoryId = result.lastInsertRowId;
  return timeMemoryId;
}

export function updateTimeMemoryRow(
  before: TimeMemoryRow,
  after: TimeMemoryRow,
): void {
  db.update(timeMemoryTable)
    .set(after)
    .where(eq(timeMemoryTable.id, before.id))
    .run();
}

export function deleteTimeMemoryRow(row: TimeMemoryRow): void {
  db.delete(timeMemoryTable).where(eq(timeMemoryTable.id, row.id)).run();
}

export function getTimeMemoryRowsById(id: number): TimeMemoryRow[] {
  const rows = db
    .select()
    .from(timeMemoryTable)
    .where(eq(timeMemoryTable.id, id))
    .all();
  return rows;
}

export function getTimeMemoriesByDayMemoryId(
  dayMemoryId: number,
): TimeMemoryRow[] {
  const rows = db
    .select()
    .from(timeMemoryTable)
    .where(eq(timeMemoryTable.dayMemoryId, dayMemoryId))
    .orderBy(desc(timeMemoryTable.timeOfRecord))
    .all();
  return rows;
}

export function createTimeMemory(
  dayMemoryId: number,
  timeOfRecord: string,
  summary: string,
  locationId?: number,
): number {
  const timeMemoryId = createTimeMemoryRow({
    dayMemoryId,
    timeOfRecord,
    summary,
    locationId: locationId ?? null,
  });
  return timeMemoryId;
}

export function getTimeMemoryById(timeMemoryId: number): TimeMemoryRow | null {
  const timeMemory = getTimeMemoryRowsById(timeMemoryId)[0] ?? null;
  return timeMemory;
}

export function updateTimeMemory(timeMemoryId: number, summary: string): void {
  db.update(timeMemoryTable)
    .set({ summary, lastUpdatedTime: new Date().toISOString() })
    .where(eq(timeMemoryTable.id, timeMemoryId))
    .run();
}

// Natural-key lookup: autoincrement ids are per-device, so import matches an
// existing memory by the day it belongs to plus its capture time.
export function getTimeMemoryByDayMemoryIdAndTime(
  dayMemoryId: number,
  timeOfRecord: string,
): TimeMemoryRow | null {
  const result = db
    .select()
    .from(timeMemoryTable)
    .where(
      and(
        eq(timeMemoryTable.dayMemoryId, dayMemoryId),
        eq(timeMemoryTable.timeOfRecord, timeOfRecord),
      ),
    )
    .get();
  const timeMemory = result ?? null;
  return timeMemory;
}

export function createTimeMemoryForImport(
  dayMemoryId: number,
  locationId: number | null,
  timeOfRecord: string,
  summary: string,
  createdAt: string,
  lastUpdatedTime: string,
): number {
  const timeMemoryId = createTimeMemoryRow({
    dayMemoryId,
    locationId,
    timeOfRecord,
    summary,
    createdAt,
    lastUpdatedTime,
  });
  return timeMemoryId;
}

// Unlike updateTimeMemory (which stamps lastUpdatedTime = now), this preserves
// the backup's own timestamp so repeat imports stay idempotent.
export function updateTimeMemoryForImport(
  timeMemoryId: number,
  locationId: number | null,
  summary: string,
  lastUpdatedTime: string,
): void {
  db.update(timeMemoryTable)
    .set({ locationId, summary, lastUpdatedTime })
    .where(eq(timeMemoryTable.id, timeMemoryId))
    .run();
}

export function getLatestTimeMemoryWithLocation(userId: number): {
  timeMemoryId: number;
  locationId: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
} | null {
  const result = db.get<{
    timeMemoryId: number;
    locationId: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
  }>(sql`
    SELECT
      tm.id as timeMemoryId,
      tm.locationId,
      l.latitude,
      l.longitude,
      tm.createdAt
    FROM TimeMemory tm
    LEFT JOIN Location l ON tm.locationId = l.id
    WHERE tm.dayMemoryId IN (
      SELECT id FROM DayMemory WHERE userId = ${userId}
    )
    ORDER BY tm.createdAt DESC LIMIT 1
  `);
  const timeMemory = result ?? null;
  return timeMemory;
}
