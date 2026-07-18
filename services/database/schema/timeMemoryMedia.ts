import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { MediaType } from "@/types/media";
import { timeMemoryTable } from "./timeMemory";

export const timeMemoryMediaTable = sqliteTable("TimeMemoryMedia", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timeMemoryId: integer("timeMemoryId")
    .notNull()
    .references(() => timeMemoryTable.id),
  mediaUri: text("mediaUri").notNull(),
  mediaType: text("mediaType").notNull().default("image").$type<MediaType>(),
  mediaLibraryAssetId: text("mediaLibraryAssetId"),
  lastUpdatedTime: text("lastUpdatedTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type TimeMemoryMediaRow = typeof timeMemoryMediaTable.$inferSelect;
export type NewTimeMemoryMediaRow = typeof timeMemoryMediaTable.$inferInsert;
