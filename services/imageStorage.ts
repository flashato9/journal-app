import { Directory, File, Paths } from "expo-file-system";

const getMemoriesDir = (): string => {
  const docDir = new Directory(Paths.document, "memories");
  return docDir.uri;
};

// Ensure memories directory exists
export const ensureMemoriesDirectory = async (): Promise<void> => {
  try {
    const MEMORIES_DIR = getMemoriesDir();
    const dir = new Directory(MEMORIES_DIR);
    await dir.create();
    console.log("Memories directory ensured:", MEMORIES_DIR);
  } catch (error) {
    console.error("Error ensuring memories directory:", error);
    throw error;
  }
};

// Copy image from temporary location to persistent storage
export const saveImagePersistently = async (
  temporaryUri: string,
): Promise<string> => {
  try {
    // Ensure directory exists
    await ensureMemoriesDirectory();

    const MEMORIES_DIR = getMemoriesDir();
    // Generate unique filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `memory_${timestamp}.jpg`;
    const persistentPath = `${MEMORIES_DIR}${filename}`;

    // Copy the file to persistent location
    const sourceFile = new File(temporaryUri);
    const destFile = new File(persistentPath);
    await sourceFile.copy(destFile);

    console.log("Image saved persistently:", persistentPath);
    return persistentPath;
  } catch (error) {
    console.error("Error saving image persistently:", error);
    throw error;
  }
};

// Clean up an image file
export const deleteImage = async (imagePath: string): Promise<void> => {
  try {
    const file = new File(imagePath);
    await file.delete();
    console.log("Image deleted:", imagePath);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};
