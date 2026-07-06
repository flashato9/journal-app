import { File, Paths } from "expo-file-system";

// Write logs to app's document directory (accessible in Expo Go)
// This is app-internal storage, accessible from the app UI
const logFile = new File(Paths.document, "app-logs.txt");
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max file size

let isInitialized = false;
let logQueue: string[] = [];
let isWriting = false;

export const initializeLogger = async () => {
  if (isInitialized) return;

  try {
    // Log the exact file path
    console.log("📍 LOGGER FILE PATH: " + logFile.uri);

    // Test file system access first
    try {
      const testFile = new File(Paths.document, "test-write.txt");
      await testFile.write("test");
      console.log("✅ Test file created at: " + testFile.uri);
      await testFile.delete();
    } catch (fsError) {
      console.error("❌ File system access failed:", fsError);
      throw fsError;
    }

    // Hook into console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = function (...args) {
      queueLog("LOG", args);
      originalLog(...args);
    };

    console.warn = function (...args) {
      queueLog("WARN", args);
      originalWarn(...args);
    };

    console.error = function (...args) {
      queueLog("ERROR", args);
      originalError(...args);
    };

    isInitialized = true;
    console.log("🟢 Logger initialized successfully");
  } catch (error) {
    console.error("🔴 Failed to initialize logger:", error);
  }
};

export const getLogFilePath = (): string => {
  return logFile.uri;
};

export const readLogs = async (): Promise<string> => {
  try {
    return await logFile.text();
  } catch (error) {
    console.error("Failed to read logs:", error);
    return "";
  }
};

export const clearLogs = async (): Promise<void> => {
  try {
    // Delete the file
    await logFile.delete();
    // Recreate it as empty
    await logFile.write("");
  } catch (error) {
    console.error("Failed to clear logs:", error);
  }
};

// Debug function to check if logs are being written
export const debugCheckLogs = async (): Promise<string> => {
  try {
    const content = await readLogs();
    console.log("📋 Current log file content:");
    console.log(content || "(empty)");
    return content;
  } catch (error) {
    console.error("Failed to read logs for debug:", error);
    return "";
  }
};

// Process the log queue
const processLogQueue = async () => {
  if (isWriting || logQueue.length === 0) return;

  isWriting = true;
  try {
    while (logQueue.length > 0) {
      const logLines = logQueue.splice(0, 10).join(""); // Process 10 at a time

      try {
        // Read existing content
        let existingContent = "";
        try {
          existingContent = await logFile.text();
        } catch {
          // File doesn't exist yet
        }

        const newContent = existingContent + logLines;

        // Write the content
        await logFile.write(newContent);
      } catch (writeError) {
        // Can't log here as it would create infinite loop
      }
    }
  } catch (error) {
    // Silent fail to avoid loops
  } finally {
    isWriting = false;
  }
};

// Queue a log message
const queueLog = (level: string, args: any[]) => {
  try {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    logQueue.push(logLine);

    // Start processing if not already running
    if (!isWriting && logQueue.length > 0) {
      processLogQueue();
    }
  } catch (error) {
    // Silent fail
  }
};
