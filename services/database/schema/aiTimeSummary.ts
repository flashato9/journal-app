import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timeMemoryTable } from "./timeMemory";

export const aiTimeSummaryTable = sqliteTable("AITimeSummary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timeMemoryId: integer("timeMemoryId")
    .notNull()
    .references(() => timeMemoryTable.id),
  summary: text("summary").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type AITimeSummaryRow = typeof aiTimeSummaryTable.$inferSelect;
export type NewAITimeSummaryRow = typeof aiTimeSummaryTable.$inferInsert;
