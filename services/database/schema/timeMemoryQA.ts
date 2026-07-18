import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timeMemoryTable } from "./timeMemory";

export const timeMemoryQATable = sqliteTable("TimeMemoryQA", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timeMemoryId: integer("timeMemoryId")
    .notNull()
    .references(() => timeMemoryTable.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  lastUpdatedTime: text("lastUpdatedTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type TimeMemoryQARow = typeof timeMemoryQATable.$inferSelect;
export type NewTimeMemoryQARow = typeof timeMemoryQATable.$inferInsert;
