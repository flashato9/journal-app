import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dayMemoryTable } from "./dayMemory";

export const aiDaySummaryTable = sqliteTable("AIDaySummary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayMemoryId: integer("dayMemoryId")
    .notNull()
    .references(() => dayMemoryTable.id),
  summary: text("summary").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type AIDaySummaryRow = typeof aiDaySummaryTable.$inferSelect;
export type NewAIDaySummaryRow = typeof aiDaySummaryTable.$inferInsert;
