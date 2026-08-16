import { and, eq, sql } from "drizzle-orm";
import { db } from "../database";
import { appSettingsTable } from "../schema/appSettings";

export function getSettingValue(
  userId: number,
  settingSchemaId: number,
): string | null {
  const row = db
    .select({ settingValue: appSettingsTable.settingValue })
    .from(appSettingsTable)
    .where(
      and(
        eq(appSettingsTable.userId, userId),
        eq(appSettingsTable.settingSchemaId, settingSchemaId),
      ),
    )
    .get();
  return row ? row.settingValue : null;
}

export function setSettingValue(
  userId: number,
  settingSchemaId: number,
  value: string,
): void {
  db.insert(appSettingsTable)
    .values({ userId, settingSchemaId, settingValue: value })
    .onConflictDoUpdate({
      target: [appSettingsTable.userId, appSettingsTable.settingSchemaId],
      set: { settingValue: value, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
    .run();
}
