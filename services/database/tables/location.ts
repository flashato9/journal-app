import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  locationTable,
  type LocationRow,
  type NewLocationRow,
} from "../schema/location";

export function createLocationRow(row: NewLocationRow): number {
  const result = db.insert(locationTable).values(row).run();
  const locationId = result.lastInsertRowId;
  return locationId;
}

export function updateLocationRow(
  before: LocationRow,
  after: LocationRow,
): void {
  db.update(locationTable)
    .set(after)
    .where(eq(locationTable.id, before.id))
    .run();
}

export function deleteLocationRow(row: LocationRow): void {
  db.delete(locationTable).where(eq(locationTable.id, row.id)).run();
}

export function getLocationRowsById(id: number): LocationRow[] {
  const rows = db
    .select()
    .from(locationTable)
    .where(eq(locationTable.id, id))
    .all();
  return rows;
}

export function insertLocation(
  userId: number,
  latitude: number,
  longitude: number,
  altitude: number | null,
): number {
  const locationId = createLocationRow({
    userId,
    latitude,
    longitude,
    altitude,
    createdDateTime: new Date().toISOString(),
  });
  return locationId;
}

export function getLocationsByUserId(userId: number, limit: number = 100) {
  const rows = db
    .select()
    .from(locationTable)
    .where(eq(locationTable.userId, userId))
    .orderBy(desc(locationTable.createdDateTime))
    .limit(limit)
    .all();
  return rows;
}

export function getLocationById(locationId: number): LocationRow | null {
  const location = getLocationRowsById(locationId)[0] ?? null;
  return location;
}

export function getLatestLocation(userId: number): LocationRow | null {
  const result = db
    .select()
    .from(locationTable)
    .where(eq(locationTable.userId, userId))
    .orderBy(desc(locationTable.createdDateTime))
    .limit(1)
    .get();
  const location = result ?? null;
  return location;
}

// Unlike getLocationsByUserId (capped at 100 for the UI), this returns the
// whole breadcrumb trail for a complete snapshot.
export function getAllLocationsByUserId(userId: number): LocationRow[] {
  const rows = db
    .select()
    .from(locationTable)
    .where(eq(locationTable.userId, userId))
    .orderBy(locationTable.createdDateTime)
    .all();
  return rows;
}

export function locationExistsAtTime(
  userId: number,
  createdDateTime: string,
): boolean {
  const result = db
    .select({ id: locationTable.id })
    .from(locationTable)
    .where(
      and(
        eq(locationTable.userId, userId),
        eq(locationTable.createdDateTime, createdDateTime),
      ),
    )
    .get();
  const exists = !!result;
  return exists;
}

export function insertLocationForImport(
  userId: number,
  latitude: number,
  longitude: number,
  altitude: number | null,
  createdDateTime: string,
): number {
  const locationId = createLocationRow({
    userId,
    latitude,
    longitude,
    altitude,
    createdDateTime,
  });
  return locationId;
}
