import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const locationSettingsTable = sqliteTable("LocationSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .unique()
    .references(() => userTable.id),
  fetchFrequency: integer("fetchFrequency").notNull().default(10),
  notificationThreshold: real("notificationThreshold").notNull().default(1),
  restThreshold: integer("restThreshold").notNull().default(10),
  locationTrackingPollFrequency: integer("locationTrackingPollFrequency")
    .notNull()
    .default(15),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastUpdatedTime: text("lastUpdatedTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type LocationSettingsRow = typeof locationSettingsTable.$inferSelect;
export type NewLocationSettingsRow = typeof locationSettingsTable.$inferInsert;
