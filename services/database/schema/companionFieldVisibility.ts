import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const companionFieldVisibilityTable = sqliteTable(
  "CompanionFieldVisibility",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => userTable.id),
    screenKey: text("screenKey").notNull(),
    fieldKey: text("fieldKey").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.userId, table.screenKey, table.fieldKey)],
);

export type CompanionFieldVisibilityRow =
  typeof companionFieldVisibilityTable.$inferSelect;
export type NewCompanionFieldVisibilityRow =
  typeof companionFieldVisibilityTable.$inferInsert;
