import { Directory, Paths } from "expo-file-system";

// Every subfolder under the app's private document directory.
export enum AppPrivateDirectoryPaths {
  // Where expo-sqlite stores journal.db (created automatically by expo-sqlite; services/database.ts)
  SQLite = "SQLite",
  // Dev-mode memory photos, saved locally instead of the OS photo library (services/imageStorage.ts)
  Memories = "images/memories",
  // Profile picture uploads, used in both dev and production (no Gallery split)
  ProfilePictures = "images/profile_pictures",
  // Staging area for profile pictures not yet committed (services/profilePictureStorage.ts)
  Temp = "images/temp",
  // App debug logs written during the session (services/logger.ts)
  AppLogs = "app-logs",
  // Downloaded GGUF model files, cached across app sessions (services/llmService.ts)
  Models = "models",
}

// Where memory photos actually get persisted, depending on build type.
export enum StorageMode {
  Local = "local", // dev: under AppPrivateDirectoryPaths.Memories
  Gallery = "gallery", // prod: OS Photo Library via expo-media-library (outside the document directory)
}

export const getActiveStorageMode = (): StorageMode =>
  __DEV__ ? StorageMode.Local : StorageMode.Gallery;

export const getAppDirectory = (name: AppPrivateDirectoryPaths): Directory =>
  new Directory(Paths.document, name);

// Creates the directory if it doesn't already exist; no-ops otherwise.
export const ensureDirectoryExists = async (
  directory: Directory,
): Promise<void> => {
  try {
    await directory.create({ intermediates: true });
  } catch (error: any) {
    if (!error.message?.includes("already exists")) {
      throw error;
    }
  }
};
