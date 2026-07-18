import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const dayMemoryTable = sqliteTable("DayMemory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => userTable.id),
  day: text("day").notNull(),
  summary: text("summary").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastUpdatedTime: text("lastUpdatedTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type DayMemoryRow = typeof dayMemoryTable.$inferSelect;
export type NewDayMemoryRow = typeof dayMemoryTable.$inferInsert;
