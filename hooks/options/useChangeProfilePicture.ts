import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import { UserTable } from "@/services/database";
import {
  deleteProfilePictureFile,
  saveProfilePicture,
  saveProfilePictureToTemp,
} from "@/services/profilePictureStorage";

interface UseChangeProfilePictureOptions {
  currentImagePath: string | null;
}

// Custom hook that encapsulates the profile picture change flow: picking a
// photo (staged in a temp folder, not yet committed), and saving it (moves
// the temp file into permanent storage, updates the DB, deletes the old
// picture). The temp file is cleaned up whenever it's replaced or the
// editor closes without saving.
export function useChangeProfilePicture({
  currentImagePath,
}: UseChangeProfilePictureOptions) {
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [savedImagePath, setSavedImagePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (tempImageUri) {
        deleteProfilePictureFile(tempImageUri).catch((error) =>
          console.error("Error deleting temp profile picture:", error),
        );
      }
    };
  }, [tempImageUri]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempImageUri(await saveProfilePictureToTemp(result.assets[0].uri));
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Photo library access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempImageUri(await saveProfilePictureToTemp(result.assets[0].uri));
    }
  };

  const pickImage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Camera", "Photo Library", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            takePhoto();
          } else if (buttonIndex === 1) {
            pickFromLibrary();
          }
        },
      );
    } else {
      Alert.alert("Change Profile Picture", "Choose an option", [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickFromLibrary },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!tempImageUri) return;

    setIsSaving(true);
    try {
      const userId = UserTable.getRegisteredUserId();
      if (!userId) return;

      // Read the old path before overwriting it in the DB.
      const oldImagePath =
        UserTable.getUserProfile(userId)?.profileImagePath ?? null;

      const newImagePath = await saveProfilePicture(tempImageUri);
      UserTable.setUserProfileImagePath(userId, newImagePath);

      if (oldImagePath) {
        await deleteProfilePictureFile(oldImagePath);
      }

      // Already-committed — clear so the unmount cleanup deletes the
      // now-orphaned temp source file. Track the new path separately so
      // the display doesn't fall back to the stale currentImagePath prop.
      setTempImageUri(null);
      setSavedImagePath(newImagePath);
    } catch (error) {
      console.error("Error saving profile picture:", error);
      Alert.alert("Error", "Failed to save profile picture. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    displayImagePath: tempImageUri ?? savedImagePath ?? currentImagePath,
    isSaving,
    canSave: !!tempImageUri,
    pickImage,
    handleSave,
  };
}
