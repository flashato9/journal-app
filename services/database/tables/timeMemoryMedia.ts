import { eq } from "drizzle-orm";
import type { MediaType } from "@/types/media";
import { db } from "../database";
import {
  timeMemoryMediaTable,
  type NewTimeMemoryMediaRow,
  type TimeMemoryMediaRow,
} from "../schema/timeMemoryMedia";

export function createTimeMemoryMediaRow(row: NewTimeMemoryMediaRow): number {
  const result = db.insert(timeMemoryMediaTable).values(row).run();
  const mediaId = result.lastInsertRowId;
  return mediaId;
}

export function updateTimeMemoryMediaRow(
  before: TimeMemoryMediaRow,
  after: TimeMemoryMediaRow,
): void {
  db.update(timeMemoryMediaTable)
    .set(after)
    .where(eq(timeMemoryMediaTable.id, before.id))
    .run();
}

export function deleteTimeMemoryMediaRow(row: TimeMemoryMediaRow): void {
  db.delete(timeMemoryMediaTable)
    .where(eq(timeMemoryMediaTable.id, row.id))
    .run();
}

export function getTimeMemoryMediaRowsById(id: number): TimeMemoryMediaRow[] {
  const rows = db
    .select()
    .from(timeMemoryMediaTable)
    .where(eq(timeMemoryMediaTable.id, id))
    .all();
  return rows;
}

export function createTimeMemoryMedia(
  timeMemoryId: number,
  mediaUri: string,
  mediaType: MediaType = "image",
  mediaLibraryAssetId: string | null = null,
): number {
  const mediaId = createTimeMemoryMediaRow({
    timeMemoryId,
    mediaUri,
    mediaType,
    mediaLibraryAssetId,
  });
  return mediaId;
}

export function getTimeMemoryMediaByTimeMemoryId(
  timeMemoryId: number,
): TimeMemoryMediaRow[] {
  const rows = db
    .select()
    .from(timeMemoryMediaTable)
    .where(eq(timeMemoryMediaTable.timeMemoryId, timeMemoryId))
    .all();
  return rows;
}

export function deleteTimeMemoryMediaByTimeMemoryId(
  timeMemoryId: number,
): void {
  db.delete(timeMemoryMediaTable)
    .where(eq(timeMemoryMediaTable.timeMemoryId, timeMemoryId))
    .run();
}

export function deleteTimeMemoryMedia(mediaId: number): void {
  db.delete(timeMemoryMediaTable)
    .where(eq(timeMemoryMediaTable.id, mediaId))
    .run();
}
