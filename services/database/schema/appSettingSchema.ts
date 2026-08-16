import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appSettingSchemaTable = sqliteTable("AppSettingSchema", {
  settingSchemaId: integer("settingSchemaId").primaryKey({
    autoIncrement: true,
  }),
  settingSchemaName: text("settingSchemaName").notNull().unique(),
  settingSchemaDescription: text("settingSchemaDescription"),
});

export type AppSettingSchemaRow = typeof appSettingSchemaTable.$inferSelect;
export type NewAppSettingSchemaRow = typeof appSettingSchemaTable.$inferInsert;
