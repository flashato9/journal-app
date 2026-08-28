import { AppSettingSchemaTable, AppSettingsTable } from "@/services/database";

export interface LocationSettingsValues {
  fetchFrequency: number;
  notificationThreshold: number;
  restThreshold: number;
  locationTrackingPollFrequency: number;
  locationFetchTimeout: number;
}

const FETCH_FREQUENCY_SETTING_NAME = "locationFetchFrequency";
const NOTIFICATION_THRESHOLD_SETTING_NAME = "locationNotificationThreshold";
const REST_THRESHOLD_SETTING_NAME = "locationRestThreshold";
const TRACKING_POLL_FREQUENCY_SETTING_NAME = "locationTrackingPollFrequency";
const FETCH_TIMEOUT_SETTING_NAME = "locationFetchTimeout";

const FETCH_FREQUENCY_DESCRIPTION = "Location fetch frequency, in seconds";
const NOTIFICATION_THRESHOLD_DESCRIPTION =
  "Location notification distance threshold, in meters";
const REST_THRESHOLD_DESCRIPTION = "Location rest period threshold, in seconds";
const TRACKING_POLL_FREQUENCY_DESCRIPTION =
  "Location tracking poll frequency, in seconds";
const FETCH_TIMEOUT_DESCRIPTION = "Location fetch timeout, in seconds";

const DEFAULT_FETCH_FREQUENCY = 10;
const DEFAULT_NOTIFICATION_THRESHOLD = 1;
const DEFAULT_REST_THRESHOLD = 10;
const DEFAULT_TRACKING_POLL_FREQUENCY = 15;
const DEFAULT_FETCH_TIMEOUT = 20;

function getNumberSetting(
  userId: number,
  settingName: string,
  settingDescription: string,
  defaultValue: number,
): number {
  const schemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    settingName,
    settingDescription,
  );
  const storedValue = AppSettingsTable.getSettingValue(userId, schemaId);
  const value = storedValue !== null ? Number(storedValue) : defaultValue;
  return value;
}

function setNumberSetting(
  userId: number,
  settingName: string,
  settingDescription: string,
  value: number,
): void {
  const schemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    settingName,
    settingDescription,
  );
  AppSettingsTable.setSettingValue(userId, schemaId, String(value));
}

// Reads this user's location tracking settings, falling back to built-in defaults.
export function getLocationSettings(userId: number): LocationSettingsValues {
  const settings = {
    fetchFrequency: getNumberSetting(
      userId,
      FETCH_FREQUENCY_SETTING_NAME,
      FETCH_FREQUENCY_DESCRIPTION,
      DEFAULT_FETCH_FREQUENCY,
    ),
    notificationThreshold: getNumberSetting(
      userId,
      NOTIFICATION_THRESHOLD_SETTING_NAME,
      NOTIFICATION_THRESHOLD_DESCRIPTION,
      DEFAULT_NOTIFICATION_THRESHOLD,
    ),
    restThreshold: getNumberSetting(
      userId,
      REST_THRESHOLD_SETTING_NAME,
      REST_THRESHOLD_DESCRIPTION,
      DEFAULT_REST_THRESHOLD,
    ),
    locationTrackingPollFrequency: getNumberSetting(
      userId,
      TRACKING_POLL_FREQUENCY_SETTING_NAME,
      TRACKING_POLL_FREQUENCY_DESCRIPTION,
      DEFAULT_TRACKING_POLL_FREQUENCY,
    ),
    locationFetchTimeout: getNumberSetting(
      userId,
      FETCH_TIMEOUT_SETTING_NAME,
      FETCH_TIMEOUT_DESCRIPTION,
      DEFAULT_FETCH_TIMEOUT,
    ),
  };
  return settings;
}

// Persists this user's location tracking settings, one AppSettings row per field.
export function saveLocationSettings(
  userId: number,
  values: LocationSettingsValues,
): void {
  setNumberSetting(
    userId,
    FETCH_FREQUENCY_SETTING_NAME,
    FETCH_FREQUENCY_DESCRIPTION,
    values.fetchFrequency,
  );
  setNumberSetting(
    userId,
    NOTIFICATION_THRESHOLD_SETTING_NAME,
    NOTIFICATION_THRESHOLD_DESCRIPTION,
    values.notificationThreshold,
  );
  setNumberSetting(
    userId,
    REST_THRESHOLD_SETTING_NAME,
    REST_THRESHOLD_DESCRIPTION,
    values.restThreshold,
  );
  setNumberSetting(
    userId,
    TRACKING_POLL_FREQUENCY_SETTING_NAME,
    TRACKING_POLL_FREQUENCY_DESCRIPTION,
    values.locationTrackingPollFrequency,
  );
  setNumberSetting(
    userId,
    FETCH_TIMEOUT_SETTING_NAME,
    FETCH_TIMEOUT_DESCRIPTION,
    values.locationFetchTimeout,
  );
}
