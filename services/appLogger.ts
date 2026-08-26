import * as FileSystem from "expo-file-system";
import {
  consoleTransport,
  fileAsyncTransport,
  logger,
} from "react-native-logs";
import {
  AppPrivateDirectoryPaths,
  ensureDirectoryExists,
  getAppDirectory,
} from "@/services/filesystem";

const LOG_ROTATION_LINE_LIMIT = 5000;

const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type CompanionLogLevel = keyof typeof LOG_LEVELS;

function resolveLogLevel(): CompanionLogLevel {
  const configuredLevel = process.env.EXPO_PUBLIC_APP_LOG_LEVEL;
  if (configuredLevel && configuredLevel in LOG_LEVELS) {
    return configuredLevel as CompanionLogLevel;
  }
  return "info";
}

const DEFAULT_LOG_FILE_NAME = "app-logs.txt";

function resolveLogFileName(): string {
  const configuredFileName = process.env.EXPO_PUBLIC_APP_LOG_FILE_NAME;
  if (configuredFileName && configuredFileName.trim().length > 0) {
    return configuredFileName;
  }
  return DEFAULT_LOG_FILE_NAME;
}

// react-native-logs' "iso" preset adds milliseconds and "Z", so this formats UTC by hand.
function formatLogDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds} | `;
  return formattedDate;
}

const APP_LOG_FILE_NAME = resolveLogFileName();
const logsDir = getAppDirectory(AppPrivateDirectoryPaths.AppLogs);
const logFile = new FileSystem.File(logsDir, APP_LOG_FILE_NAME);
const archiveDir = getAppDirectory(AppPrivateDirectoryPaths.AppLogsArchive);

let logLineCount = 0;

const loggerConfig = {
  levels: LOG_LEVELS,
  severity: resolveLogLevel(),
  dateFormat: formatLogDate,
  transport: [consoleTransport, fileAsyncTransport],
  transportOptions: {
    colors: {
      trace: "grey",
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    } as const,
    FS: FileSystem,
    fileName: APP_LOG_FILE_NAME,
    filePath: logsDir.uri,
  },
};

const appLogger = logger.createLogger(loggerConfig);

export function logTrace(...args: unknown[]): void {
  appLogger.trace(...args);
  recordLogLine();
}

export function logInfo(...args: unknown[]): void {
  appLogger.info(...args);
  recordLogLine();
}

export function logWarn(...args: unknown[]): void {
  appLogger.warn(...args);
  recordLogLine();
}

export function logError(...args: unknown[]): void {
  appLogger.error(...args);
  recordLogLine();
}

export const readLogs = async (): Promise<string> => {
  try {
    return await logFile.text();
  } catch (error) {
    logError("Failed to read logs:", error);
    return "";
  }
};

// Not race-safe: a write from fileAsyncTransport's own internal queue can land mid-clear, since that queue can't be synchronized with from here.
export const clearLogs = async (): Promise<void> => {
  try {
    await logFile.delete();
    await logFile.write("");
  } catch (error) {
    logError("Failed to clear logs:", error);
  }
};

function countLogLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }
  const lines = content.split("\n").filter((line) => line.length > 0);
  return lines.length;
}

// Copies the current log file into the archive folder with a timestamped name, then clears it. Shares clearLogs' race-safety caveat.
async function rotateLogFile(): Promise<void> {
  try {
    await ensureDirectoryExists(archiveDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveFile = new FileSystem.File(
      archiveDir,
      `${timestamp}-${APP_LOG_FILE_NAME}`,
    );
    const currentContent = await logFile.text();
    await archiveFile.write(currentContent);
    await clearLogs();
  } catch (error) {
    logError("Failed to rotate log file:", error);
  }
}

function recordLogLine(): void {
  logLineCount += 1;
  if (logLineCount >= LOG_ROTATION_LINE_LIMIT) {
    logLineCount = 0;
    rotateLogFile();
  }
}

// Fire-and-forget: seeds the in-memory line count from the file that already existed when the app launched.
async function initializeLogLineCount(): Promise<void> {
  try {
    const existingContent = await logFile.text();
    logLineCount = countLogLines(existingContent);
  } catch {
    logLineCount = 0;
  }
}

initializeLogLineCount();
