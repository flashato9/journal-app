import { eq } from "drizzle-orm";
import { db } from "../database";
import { appSettingSchemaTable } from "../schema/appSettingSchema";

export function getOrCreateSettingSchemaId(
  name: string,
  description: string,
): number {
  const existingRow = db
    .select({ settingSchemaId: appSettingSchemaTable.settingSchemaId })
    .from(appSettingSchemaTable)
    .where(eq(appSettingSchemaTable.settingSchemaName, name))
    .get();
  if (existingRow) {
    return existingRow.settingSchemaId;
  }
  const insertedRow = db
    .insert(appSettingSchemaTable)
    .values({ settingSchemaName: name, settingSchemaDescription: description })
    .returning({ settingSchemaId: appSettingSchemaTable.settingSchemaId })
    .get();
  return insertedRow.settingSchemaId;
}
