import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  AppPrivateDirectoryPaths,
  ensureDirectoryExists,
  getActiveStorageMode,
  getAppDirectory,
  StorageMode,
} from "@/services/filesystem";

// Save image to gallery (production) or local app storage (development)
export const saveImagePersistently = async (
  temporaryUri: string,
): Promise<string> => {
  try {
    if (getActiveStorageMode() === StorageMode.Gallery) {
      // Production: Save to photo library
      const permission = await MediaLibrary.requestPermissionsAsync(false, [
        "photo",
      ]);
      if (!permission.granted) {
        throw new Error("Photo library permission not granted");
      }

      const asset = await MediaLibrary.createAssetAsync(temporaryUri);
      console.log("Image saved to photo library:", asset.uri);
      return asset.uri;
    } else {
      // Development: Save to app local file system
      const memoriesDir = getAppDirectory(AppPrivateDirectoryPaths.Memories);
      await ensureDirectoryExists(memoriesDir);
      const fileName = `photo_${Date.now()}.jpg`;
      const targetUri = `${memoriesDir.uri}/${fileName}`;

      // Copy temporary image to memories directory
      const file = new File(temporaryUri);
      const targetFile = new File(targetUri);
      await file.copy(targetFile);

      console.log("Image saved to local app storage:", targetUri);
      return targetUri;
    }
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
};

// Delete image from gallery (production) or local app storage (development)
export const deleteImage = async (imagePath: string): Promise<void> => {
  try {
    if (getActiveStorageMode() === StorageMode.Gallery) {
      // Production: Delete from photo library
      await MediaLibrary.deleteAssetsAsync([imagePath]);
      console.log("Image deleted from photo library:", imagePath);
    } else {
      // Development: Delete from local app storage
      const file = new File(imagePath);
      await file.delete();
      console.log("Image deleted from local app storage:", imagePath);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};
