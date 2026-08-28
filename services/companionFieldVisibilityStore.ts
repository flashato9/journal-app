import { COMPANION_NARROWABLE_FIELDS } from "@/constants/companionFields";
import { AppSettingSchemaTable, AppSettingsTable } from "@/services/database";

const HIDDEN_VALUE = "hidden";
const VISIBLE_VALUE = "visible";

function getFieldSettingSchemaId(screenKey: string, fieldKey: string): number {
  const settingName = `companionFieldHidden.${screenKey}.${fieldKey}`;
  const settingDescription = `Whether the "${fieldKey}" field is hidden from the companion on the "${screenKey}" screen`;
  const schemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    settingName,
    settingDescription,
  );
  return schemaId;
}

// Checks whether a companion-narrowable field is currently hidden for this user.
export function isFieldHidden(
  userId: number,
  screenKey: string,
  fieldKey: string,
): boolean {
  const schemaId = getFieldSettingSchemaId(screenKey, fieldKey);
  const storedValue = AppSettingsTable.getSettingValue(userId, schemaId);
  const hidden = storedValue === HIDDEN_VALUE;
  return hidden;
}

// Lists which of a screen's narrowable fields are currently hidden for this user.
export function getHiddenFieldKeysForScreen(
  userId: number,
  screenKey: string,
): string[] {
  const screenFields = COMPANION_NARROWABLE_FIELDS.filter(
    (field) => field.screenKey === screenKey,
  );
  const hiddenFieldKeys = screenFields
    .filter((field) => isFieldHidden(userId, screenKey, field.fieldKey))
    .map((field) => field.fieldKey);
  return hiddenFieldKeys;
}

// Sets whether a companion-narrowable field is hidden for this user.
export function setFieldHidden(
  userId: number,
  screenKey: string,
  fieldKey: string,
  hidden: boolean,
): void {
  const schemaId = getFieldSettingSchemaId(screenKey, fieldKey);
  const value = hidden ? HIDDEN_VALUE : VISIBLE_VALUE;
  AppSettingsTable.setSettingValue(userId, schemaId, value);
}
