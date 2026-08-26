import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const pageThreadTable = sqliteTable(
  "PageThread",
  {
    pageThreadId: integer("pageThreadId").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => userTable.id),
    resourceId: text("resourceId").notNull(),
    threadId: text("threadId").notNull(),
    pageName: text("pageName").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.userId, table.pageName)],
);

export type PageThreadRow = typeof pageThreadTable.$inferSelect;
export type NewPageThreadRow = typeof pageThreadTable.$inferInsert;
