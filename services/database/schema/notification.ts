import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const notificationTable = sqliteTable("Notification", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => userTable.id),
  notificationMessage: text("notificationMessage").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type NotificationRow = typeof notificationTable.$inferSelect;
export type NewNotificationRow = typeof notificationTable.$inferInsert;
