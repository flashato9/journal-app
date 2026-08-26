import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  pageThreadTable,
  type NewPageThreadRow,
  type PageThreadRow,
} from "../schema/pageThread";

export function getPageThread(
  userId: number,
  pageName: string,
): PageThreadRow | null {
  const result = db
    .select()
    .from(pageThreadTable)
    .where(
      and(
        eq(pageThreadTable.userId, userId),
        eq(pageThreadTable.pageName, pageName),
      ),
    )
    .get();
  const pageThread = result ?? null;
  return pageThread;
}

export function createPageThread(row: NewPageThreadRow): number {
  const result = db.insert(pageThreadTable).values(row).run();
  const pageThreadId = result.lastInsertRowId;
  return pageThreadId;
}

export function getPageThreadsForUser(userId: number): PageThreadRow[] {
  const result = db
    .select()
    .from(pageThreadTable)
    .where(eq(pageThreadTable.userId, userId))
    .orderBy(desc(pageThreadTable.createdAt))
    .all();
  return result;
}
