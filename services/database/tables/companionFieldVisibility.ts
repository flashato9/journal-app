import { and, eq } from "drizzle-orm";
import { db } from "../database";
import { companionFieldVisibilityTable } from "../schema/companionFieldVisibility";

export function getHiddenFields(userId: number, screenKey: string): string[] {
  const rows = db
    .select({ fieldKey: companionFieldVisibilityTable.fieldKey })
    .from(companionFieldVisibilityTable)
    .where(
      and(
        eq(companionFieldVisibilityTable.userId, userId),
        eq(companionFieldVisibilityTable.screenKey, screenKey),
      ),
    )
    .all();
  return rows.map((row) => row.fieldKey);
}

export function setFieldHidden(
  userId: number,
  screenKey: string,
  fieldKey: string,
  hidden: boolean,
): void {
  if (hidden) {
    db.insert(companionFieldVisibilityTable)
      .values({ userId, screenKey, fieldKey })
      .onConflictDoNothing()
      .run();
  } else {
    db.delete(companionFieldVisibilityTable)
      .where(
        and(
          eq(companionFieldVisibilityTable.userId, userId),
          eq(companionFieldVisibilityTable.screenKey, screenKey),
          eq(companionFieldVisibilityTable.fieldKey, fieldKey),
        ),
      )
      .run();
  }
}
