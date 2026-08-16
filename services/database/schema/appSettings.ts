import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { appSettingSchemaTable } from "./appSettingSchema";
import { userTable } from "./user";

export const appSettingsTable = sqliteTable(
  "AppSettings",
  {
    settingId: integer("settingId").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => userTable.id),
    settingSchemaId: integer("settingSchemaId")
      .notNull()
      .references(() => appSettingSchemaTable.settingSchemaId),
    settingValue: text("settingValue").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.userId, table.settingSchemaId)],
);

export type AppSettingsRow = typeof appSettingsTable.$inferSelect;
export type NewAppSettingsRow = typeof appSettingsTable.$inferInsert;
