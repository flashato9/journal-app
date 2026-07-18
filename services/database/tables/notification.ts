import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  notificationTable,
  type NewNotificationRow,
  type NotificationRow,
} from "../schema/notification";

export function createNotificationRow(row: NewNotificationRow): number {
  const result = db.insert(notificationTable).values(row).run();
  const notificationId = result.lastInsertRowId;
  return notificationId;
}

export function updateNotificationRow(
  before: NotificationRow,
  after: NotificationRow,
): void {
  db.update(notificationTable)
    .set(after)
    .where(eq(notificationTable.id, before.id))
    .run();
}

export function deleteNotificationRow(row: NotificationRow): void {
  db.delete(notificationTable).where(eq(notificationTable.id, row.id)).run();
}

export function getNotificationRowsById(id: number): NotificationRow[] {
  const rows = db
    .select()
    .from(notificationTable)
    .where(eq(notificationTable.id, id))
    .all();
  return rows;
}

export function insertNotification(
  userId: number,
  notificationMessage: string,
): number {
  const notificationId = createNotificationRow({
    userId,
    notificationMessage,
    createdAt: new Date().toISOString(),
  });
  return notificationId;
}

export function getLatestNotification(
  userId: number,
): { id: number; createdAt: string } | null {
  const result = db
    .select({
      id: notificationTable.id,
      createdAt: notificationTable.createdAt,
    })
    .from(notificationTable)
    .where(eq(notificationTable.userId, userId))
    .orderBy(desc(notificationTable.createdAt))
    .limit(1)
    .get();
  const notification = result ?? null;
  return notification;
}

export function getNotificationsByUserId(userId: number) {
  const rows = db
    .select()
    .from(notificationTable)
    .where(eq(notificationTable.userId, userId))
    .orderBy(notificationTable.createdAt)
    .all();
  return rows;
}

export function notificationExistsAtTime(
  userId: number,
  createdAt: string,
): boolean {
  const result = db
    .select({ id: notificationTable.id })
    .from(notificationTable)
    .where(
      and(
        eq(notificationTable.userId, userId),
        eq(notificationTable.createdAt, createdAt),
      ),
    )
    .get();
  const exists = !!result;
  return exists;
}

export function insertNotificationForImport(
  userId: number,
  notificationMessage: string,
  createdAt: string,
): number {
  const notificationId = createNotificationRow({
    userId,
    notificationMessage,
    createdAt,
  });
  return notificationId;
}
