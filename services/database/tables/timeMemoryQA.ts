import { eq } from "drizzle-orm";
import { db } from "../database";
import {
  timeMemoryQATable,
  type NewTimeMemoryQARow,
  type TimeMemoryQARow,
} from "../schema/timeMemoryQA";

export function createTimeMemoryQARow(row: NewTimeMemoryQARow): number {
  const result = db.insert(timeMemoryQATable).values(row).run();
  const qaId = result.lastInsertRowId;
  return qaId;
}

export function updateTimeMemoryQARow(
  before: TimeMemoryQARow,
  after: TimeMemoryQARow,
): void {
  db.update(timeMemoryQATable)
    .set(after)
    .where(eq(timeMemoryQATable.id, before.id))
    .run();
}

export function deleteTimeMemoryQARow(row: TimeMemoryQARow): void {
  db.delete(timeMemoryQATable).where(eq(timeMemoryQATable.id, row.id)).run();
}

export function getTimeMemoryQARowsById(id: number): TimeMemoryQARow[] {
  const rows = db
    .select()
    .from(timeMemoryQATable)
    .where(eq(timeMemoryQATable.id, id))
    .all();
  return rows;
}

export function createTimeMemoryQA(
  timeMemoryId: number,
  question: string,
  answer: string,
): number {
  const qaId = createTimeMemoryQARow({ timeMemoryId, question, answer });
  return qaId;
}

export function getTimeMemoryQAByTimeMemoryId(
  timeMemoryId: number,
): TimeMemoryQARow[] {
  const rows = db
    .select()
    .from(timeMemoryQATable)
    .where(eq(timeMemoryQATable.timeMemoryId, timeMemoryId))
    .all();
  return rows;
}

export function deleteTimeMemoryQAByTimeMemoryId(timeMemoryId: number): void {
  db.delete(timeMemoryQATable)
    .where(eq(timeMemoryQATable.timeMemoryId, timeMemoryId))
    .run();
}

export function updateTimeMemoryQA(
  qaId: number,
  question: string,
  answer: string,
): void {
  db.update(timeMemoryQATable)
    .set({ question, answer, lastUpdatedTime: new Date().toISOString() })
    .where(eq(timeMemoryQATable.id, qaId))
    .run();
}

export function deleteTimeMemoryQA(qaId: number): void {
  db.delete(timeMemoryQATable).where(eq(timeMemoryQATable.id, qaId)).run();
}
