import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dayMemoryTable } from "./dayMemory";
import { locationTable } from "./location";

export const timeMemoryTable = sqliteTable("TimeMemory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayMemoryId: integer("dayMemoryId")
    .notNull()
    .references(() => dayMemoryTable.id),
  locationId: integer("locationId").references(() => locationTable.id),
  timeOfRecord: text("timeOfRecord").notNull(),
  summary: text("summary").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastUpdatedTime: text("lastUpdatedTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type TimeMemoryRow = typeof timeMemoryTable.$inferSelect;
export type NewTimeMemoryRow = typeof timeMemoryTable.$inferInsert;
