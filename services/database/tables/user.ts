import { eq } from "drizzle-orm";
import { db } from "../database";
import { userTable, type NewUserRow, type UserRow } from "../schema/user";

export function createUserRow(row: NewUserRow): number {
  const result = db.insert(userTable).values(row).run();
  const userId = result.lastInsertRowId;
  return userId;
}

export function updateUserRow(before: UserRow, after: UserRow): void {
  db.update(userTable).set(after).where(eq(userTable.id, before.id)).run();
}

export function deleteUserRow(row: UserRow): void {
  db.delete(userTable).where(eq(userTable.id, row.id)).run();
}

export function getUserRowsById(id: number): UserRow[] {
  const rows = db.select().from(userTable).where(eq(userTable.id, id)).all();
  return rows;
}

export function isUserExists(username: string): boolean {
  const result = db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.username, username))
    .get();
  const exists = !!result;
  return exists;
}

export function insertUserIntoDB(username: string): number {
  const userId = createUserRow({ username });
  return userId;
}

export function setUserPreferredLoginMethod(
  userId: number,
  preferredLoginMethod: string,
): void {
  db.update(userTable)
    .set({ preferredLoginMethod })
    .where(eq(userTable.id, userId))
    .run();
}

export function setUserProfileImagePath(
  userId: number,
  profileImagePath: string,
): void {
  db.update(userTable)
    .set({ profileImagePath })
    .where(eq(userTable.id, userId))
    .run();
}

export function updateUsername(userId: number, newUsername: string): void {
  db.update(userTable)
    .set({ username: newUsername })
    .where(eq(userTable.id, userId))
    .run();
}

export function getUserIdByUsername(username: string): number | null {
  const result = db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.username, username))
    .get();
  const userId = result?.id ?? null;
  return userId;
}

export function isUserRegistered(): boolean {
  const result = db.select({ id: userTable.id }).from(userTable).get();
  const registered = !!result;
  return registered;
}

export function getRegisteredUserId(): number | null {
  const result = db.select({ id: userTable.id }).from(userTable).limit(1).get();
  const userId = result?.id ?? null;
  return userId;
}

export function getUserProfile(id: number): {
  username: string;
  profileImagePath: string | null;
  preferredLoginMethod: string | null;
} | null {
  const result = db
    .select({
      username: userTable.username,
      profileImagePath: userTable.profileImagePath,
      preferredLoginMethod: userTable.preferredLoginMethod,
    })
    .from(userTable)
    .where(eq(userTable.id, id))
    .get();
  const profile = result ?? null;
  return profile;
}
