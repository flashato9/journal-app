import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const locationTable = sqliteTable("Location", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => userTable.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  altitude: real("altitude"),
  createdDateTime: text("createdDateTime")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type LocationRow = typeof locationTable.$inferSelect;
export type NewLocationRow = typeof locationTable.$inferInsert;
