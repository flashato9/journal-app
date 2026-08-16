import { useCallback, useState } from "react";
import {
  AppSettingSchemaTable,
  AppSettingsTable,
  UserTable,
} from "@/services/database";

const COMPANION_WINDOW_WIDTH_SETTING_NAME = "companionWindowWidth";
const COMPANION_WINDOW_HEIGHT_SETTING_NAME = "companionWindowHeight";
const WINDOW_WIDTH_DESCRIPTION = "Companion chat window width, in dp";
const WINDOW_HEIGHT_DESCRIPTION = "Companion chat window height, in dp";

interface CompanionWindowSize {
  width: number;
  height: number;
}

function loadInitialSize(
  defaultWidth: number,
  defaultHeight: number,
): CompanionWindowSize {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    return { width: defaultWidth, height: defaultHeight };
  }
  const widthSchemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    COMPANION_WINDOW_WIDTH_SETTING_NAME,
    WINDOW_WIDTH_DESCRIPTION,
  );
  const heightSchemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    COMPANION_WINDOW_HEIGHT_SETTING_NAME,
    WINDOW_HEIGHT_DESCRIPTION,
  );
  const storedWidth = AppSettingsTable.getSettingValue(userId, widthSchemaId);
  const storedHeight = AppSettingsTable.getSettingValue(userId, heightSchemaId);
  const size = {
    width: storedWidth ? Number(storedWidth) : defaultWidth,
    height: storedHeight ? Number(storedHeight) : defaultHeight,
  };
  return size;
}

function saveWindowSize(width: number, height: number): void {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    return;
  }
  const widthSchemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    COMPANION_WINDOW_WIDTH_SETTING_NAME,
    WINDOW_WIDTH_DESCRIPTION,
  );
  const heightSchemaId = AppSettingSchemaTable.getOrCreateSettingSchemaId(
    COMPANION_WINDOW_HEIGHT_SETTING_NAME,
    WINDOW_HEIGHT_DESCRIPTION,
  );
  AppSettingsTable.setSettingValue(userId, widthSchemaId, String(width));
  AppSettingsTable.setSettingValue(userId, heightSchemaId, String(height));
}

interface UseCompanionWindowLayoutResult {
  initialWidth: number;
  initialHeight: number;
  saveLayout: (width: number, height: number) => void;
}

export function useCompanionWindowLayout(
  defaultWidth: number,
  defaultHeight: number,
): UseCompanionWindowLayoutResult {
  const [initialSize] = useState(() =>
    loadInitialSize(defaultWidth, defaultHeight),
  );

  const saveLayout = useCallback((width: number, height: number) => {
    saveWindowSize(width, height);
  }, []);

  const result = {
    initialWidth: initialSize.width,
    initialHeight: initialSize.height,
    saveLayout,
  };
  return result;
}
