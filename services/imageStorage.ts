import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

// Save to gallery in production, local app storage in development
const SAVE_TO_GALLERY = !__DEV__;

const getMemoriesDir = (): string => {
  const docDir = new Directory(Paths.document, "memories");
  return docDir.uri;
};

// Ensure memories directory exists
export const ensureMemoriesDirectory = async (): Promise<void> => {
  try {
    const MEMORIES_DIR = getMemoriesDir();
    const dir = new Directory(MEMORIES_DIR);

    try {
      await dir.create();
      console.log("Memories directory created:", MEMORIES_DIR);
    } catch (createError: any) {
      // If directory already exists, that's okay
      if (createError.message?.includes("already exists")) {
        console.log("Memories directory already exists:", MEMORIES_DIR);
      } else {
        throw createError;
      }
    }
  } catch (error) {
    console.error("Error ensuring memories directory:", error);
    throw error;
  }
};

// Save image to gallery (production) or local app storage (development)
export const saveImagePersistently = async (
  temporaryUri: string,
): Promise<string> => {
  try {
    if (SAVE_TO_GALLERY) {
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
      await ensureMemoriesDirectory();
      const MEMORIES_DIR = getMemoriesDir();
      const fileName = `photo_${Date.now()}.jpg`;
      const targetUri = `${MEMORIES_DIR}/${fileName}`;

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
    if (SAVE_TO_GALLERY) {
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
