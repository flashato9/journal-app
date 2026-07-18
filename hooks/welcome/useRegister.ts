import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { PreferredAuthMethod } from "@/constants/authMethod";
import { usePasswordField } from "@/hooks/welcome/usePasswordField";
import { useUsernameField } from "@/hooks/welcome/useUsernameField";
import { UserTable } from "@/services/database";
import {
  saveProfilePicture,
  savePlaceholderProfilePicture,
} from "@/services/profilePictureStorage";

export type { PreferredAuthMethod } from "@/constants/authMethod";

// Custom hook that encapsulates the registration flow (form state,
// per-field validation, and SecureStore account creation). Reads the
// router directly, so the screen only wires up UI.
export function useRegister() {
  const router = useRouter();
  const {
    username,
    usernameError,
    handleUsernameChange,
    validateUsername,
    isUsernameValid,
  } = useUsernameField();
  const {
    password,
    passwordError,
    handlePasswordChange,
    validatePassword,
    isPasswordValid,
  } = usePasswordField();
  const [preferredAuthMethod, setPreferredAuthMethod] =
    useState<PreferredAuthMethod>("PASSWORD");
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const takeProfilePicture = async () => {
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
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const pickProfilePictureFromLibrary = async () => {
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
      setProfileImageUri(result.assets[0].uri);
    }
  };

  // Opens a Camera / Photo Library chooser, then stores the picked URI.
  // The picture isn't persisted until registration actually completes.
  const pickProfilePicture = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Camera", "Photo Library", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            takeProfilePicture();
          } else if (buttonIndex === 1) {
            pickProfilePictureFromLibrary();
          }
        },
      );
    } else {
      Alert.alert("Upload Profile Picture", "Choose an option", [
        { text: "Camera", onPress: takeProfilePicture },
        { text: "Photo Library", onPress: pickProfilePictureFromLibrary },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleRegister = async () => {
    // Final validation before submit
    if (!validateUsername()) {
      return;
    }

    if (!validatePassword()) {
      return;
    }

    try {
      const key = `login.${username}`;

      // Check if username already exists
      const existingPassword = await SecureStore.getItemAsync(key);
      if (existingPassword) {
        Alert.alert(
          "Username Already Registered",
          "This username is already taken. Please try another one or go to login.",
        );
        return;
      }

      // Store password in SecureStore with namespace login.<username>
      await SecureStore.setItemAsync(key, password);

      // Create the DB user row now so the preferred login method is
      // available immediately (login otherwise has no way to know it
      // until the DB row is created on first successful login).
      try {
        if (!UserTable.isUserExists(username)) {
          const userId = UserTable.insertUserIntoDB(username);
          UserTable.setUserPreferredLoginMethod(userId, preferredAuthMethod);

          const profileImagePath = profileImageUri
            ? await saveProfilePicture(profileImageUri)
            : await savePlaceholderProfilePicture();
          UserTable.setUserProfileImagePath(userId, profileImagePath);
        }
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
      }

      console.log("Registration successful:", { username, storedIn: key });

      Alert.alert("Success", "Account created! Please log in.");
      router.replace("/(welcome)/login");
    } catch (error) {
      console.error("Error during registration:", error);
      Alert.alert(
        "Registration Failed",
        "An error occurred during registration. Please try again.",
      );
    }
  };

  const isRegisterEnabled = isUsernameValid && isPasswordValid;

  return {
    username,
    password,
    usernameError,
    passwordError,
    preferredAuthMethod,
    setPreferredAuthMethod,
    profileImageUri,
    pickProfilePicture,
    handleUsernameChange,
    handlePasswordChange,
    handleRegister,
    isRegisterEnabled,
  };
}
