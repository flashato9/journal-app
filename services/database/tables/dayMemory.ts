import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  dayMemoryTable,
  type DayMemoryRow,
  type NewDayMemoryRow,
} from "../schema/dayMemory";

export function createDayMemoryRow(row: NewDayMemoryRow): number {
  const result = db.insert(dayMemoryTable).values(row).run();
  const dayMemoryId = result.lastInsertRowId;
  return dayMemoryId;
}

export function updateDayMemoryRow(
  before: DayMemoryRow,
  after: DayMemoryRow,
): void {
  db.update(dayMemoryTable)
    .set(after)
    .where(eq(dayMemoryTable.id, before.id))
    .run();
}

export function deleteDayMemoryRow(row: DayMemoryRow): void {
  db.delete(dayMemoryTable).where(eq(dayMemoryTable.id, row.id)).run();
}

export function getDayMemoryRowsById(id: number): DayMemoryRow[] {
  const rows = db
    .select()
    .from(dayMemoryTable)
    .where(eq(dayMemoryTable.id, id))
    .all();
  return rows;
}

export function getDayMemoriesByUserId(userId: number): DayMemoryRow[] {
  const rows = db
    .select()
    .from(dayMemoryTable)
    .where(eq(dayMemoryTable.userId, userId))
    .orderBy(desc(dayMemoryTable.day))
    .all();
  return rows;
}

export function isDayMemoryExists(userId: number, day: string): boolean {
  const result = db
    .select({ id: dayMemoryTable.id })
    .from(dayMemoryTable)
    .where(and(eq(dayMemoryTable.userId, userId), eq(dayMemoryTable.day, day)))
    .get();
  const exists = !!result;
  return exists;
}

export function createDayMemory(
  userId: number,
  day: string,
  summary: string = "Summary TBD",
): number {
  const dayMemoryId = createDayMemoryRow({ userId, day, summary });
  return dayMemoryId;
}

export function getDayMemoryById(dayMemoryId: number): DayMemoryRow | null {
  const dayMemory = getDayMemoryRowsById(dayMemoryId)[0] ?? null;
  return dayMemory;
}

export function updateDayMemory(dayMemoryId: number, summary: string): void {
  db.update(dayMemoryTable)
    .set({ summary })
    .where(eq(dayMemoryTable.id, dayMemoryId))
    .run();
}

export function getDayMemoryByUserIdAndDay(
  userId: number,
  day: string,
): { id: number } | null {
  const result = db
    .select({ id: dayMemoryTable.id })
    .from(dayMemoryTable)
    .where(and(eq(dayMemoryTable.userId, userId), eq(dayMemoryTable.day, day)))
    .get();
  const dayMemory = result ?? null;
  return dayMemory;
}

export function createDayMemoryForImport(
  userId: number,
  day: string,
  summary: string,
  createdAt: string,
  lastUpdatedTime: string,
): number {
  const dayMemoryId = createDayMemoryRow({
    userId,
    day,
    summary,
    createdAt,
    lastUpdatedTime,
  });
  return dayMemoryId;
}

export function updateDayMemoryForImport(
  dayMemoryId: number,
  summary: string,
  lastUpdatedTime: string,
): void {
  db.update(dayMemoryTable)
    .set({ summary, lastUpdatedTime })
    .where(eq(dayMemoryTable.id, dayMemoryId))
    .run();
}
