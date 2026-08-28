import { AppSettingSchemaTable, AppSettingsTable } from "@/services/database";

const PREFERRED_LOGIN_METHOD_SETTING_NAME = "userPreferredLoginMethod";
const PREFERRED_LOGIN_METHOD_DESCRIPTION =
  "User's preferred login method (PASSWORD or BIOMETRIC)";

function getSchemaId(): number {
  const schemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    PREFERRED_LOGIN_METHOD_SETTING_NAME,
    PREFERRED_LOGIN_METHOD_DESCRIPTION,
  );
  return schemaId;
}

// Reads this user's preferred login method, or null if never set.
export function getPreferredLoginMethod(userId: number): string | null {
  const schemaId = getSchemaId();
  const value = AppSettingsTable.getSettingValue(userId, schemaId);
  return value;
}

// Sets this user's preferred login method.
export function setPreferredLoginMethod(
  userId: number,
  preferredLoginMethod: string,
): void {
  const schemaId = getSchemaId();
  AppSettingsTable.setSettingValue(userId, schemaId, preferredLoginMethod);
}
