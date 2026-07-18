import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("User", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  profileImagePath: text("profileImagePath"),
  preferredLoginMethod: text("preferredLoginMethod"),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type UserRow = typeof userTable.$inferSelect;
export type NewUserRow = typeof userTable.$inferInsert;
