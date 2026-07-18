import { eq } from "drizzle-orm";
import { db } from "../database";
import {
  locationSettingsTable,
  type LocationSettingsRow,
  type NewLocationSettingsRow,
} from "../schema/locationSettings";

export function createLocationSettingsRow(row: NewLocationSettingsRow): number {
  const result = db.insert(locationSettingsTable).values(row).run();
  const settingsId = result.lastInsertRowId;
  return settingsId;
}

export function updateLocationSettingsRow(
  before: LocationSettingsRow,
  after: LocationSettingsRow,
): void {
  db.update(locationSettingsTable)
    .set(after)
    .where(eq(locationSettingsTable.id, before.id))
    .run();
}

export function deleteLocationSettingsRow(row: LocationSettingsRow): void {
  db.delete(locationSettingsTable)
    .where(eq(locationSettingsTable.id, row.id))
    .run();
}

export function getLocationSettingsRowsById(id: number): LocationSettingsRow[] {
  const rows = db
    .select()
    .from(locationSettingsTable)
    .where(eq(locationSettingsTable.id, id))
    .all();
  return rows;
}

export function getLocationSettingsByUserId(
  userId: number,
): LocationSettingsRow | null {
  const result = db
    .select()
    .from(locationSettingsTable)
    .where(eq(locationSettingsTable.userId, userId))
    .get();
  const settings = result ?? null;
  return settings;
}

export function createLocationSettings(
  userId: number,
  fetchFrequency: number = 10,
  notificationThreshold: number = 1,
  restThreshold: number = 10,
  locationTrackingPollFrequency: number = 15,
): number {
  const now = new Date().toISOString();
  const settingsId = createLocationSettingsRow({
    userId,
    fetchFrequency,
    notificationThreshold,
    restThreshold,
    locationTrackingPollFrequency,
    createdAt: now,
    lastUpdatedTime: now,
  });
  return settingsId;
}

export function updateLocationSettings(
  userId: number,
  fetchFrequency: number,
  notificationThreshold: number,
  restThreshold: number,
  locationTrackingPollFrequency: number,
): void {
  db.update(locationSettingsTable)
    .set({
      fetchFrequency,
      notificationThreshold,
      restThreshold,
      locationTrackingPollFrequency,
      lastUpdatedTime: new Date().toISOString(),
    })
    .where(eq(locationSettingsTable.userId, userId))
    .run();
}
