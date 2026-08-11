import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { PreferredAuthMethod } from "@/constants/authMethod";
import { useCompanionPageSnapshot } from "@/hooks/companion/useCompanionPageSnapshot";
import { usePasswordField } from "@/hooks/welcome/usePasswordField";
import { useReviewerAccess } from "@/hooks/welcome/useReviewerAccess";
import { useUsernameField } from "@/hooks/welcome/useUsernameField";
import { UserTable } from "@/services/database";
import { CompanionPageSnapshot } from "@/services/companionApi";
import {
  saveProfilePicture,
  savePlaceholderProfilePicture,
} from "@/services/profilePictureStorage";

export type { PreferredAuthMethod } from "@/constants/authMethod";

type RegistrationOutcome = "created" | "already_exists";

// Shared account-creation step for both a real form submission and the
// reviewer-unlock shortcut, so the reviewer account goes through the exact
// same SecureStore/DB path a normal registration does.
async function registerAccount(
  username: string,
  password: string,
  preferredAuthMethod: PreferredAuthMethod,
  profileImageUri: string | null,
): Promise<RegistrationOutcome> {
  const key = `login.${username}`;

  const existingPassword = await SecureStore.getItemAsync(key);
  if (existingPassword) {
    return "already_exists";
  }

  await SecureStore.setItemAsync(key, password);

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

  return "created";
}

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
  const reviewerAccess = useReviewerAccess(registerAccount);
  const [preferredAuthMethod, setPreferredAuthMethod] =
    useState<PreferredAuthMethod>("PASSWORD");
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  const companionSnapshot: CompanionPageSnapshot = { username, profileImageUri };
  useCompanionPageSnapshot("register", companionSnapshot);

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
  };

  const confirmPasswordError =
    confirmPassword !== "" && confirmPassword !== password
      ? "Passwords do not match"
      : "";
  const isConfirmPasswordValid =
    confirmPassword !== "" && confirmPassword === password;

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

    if (password !== confirmPassword) {
      return;
    }

    try {
      const outcome = await registerAccount(
        username,
        password,
        preferredAuthMethod,
        profileImageUri,
      );

      if (outcome === "already_exists") {
        Alert.alert(
          "Username Already Registered",
          "This username is already taken. Please try another one or go to login.",
        );
        return;
      }

      console.log("Registration successful:", { username });

      router.replace("/(welcome)/login");
    } catch (error) {
      console.error("Error during registration:", error);
      Alert.alert(
        "Registration Failed",
        "An error occurred during registration. Please try again.",
      );
    }
  };

  const isRegisterEnabled =
    isUsernameValid && isPasswordValid && isConfirmPasswordValid;

  return {
    username,
    password,
    usernameError,
    passwordError,
    confirmPassword,
    confirmPasswordError,
    handleConfirmPasswordChange,
    preferredAuthMethod,
    setPreferredAuthMethod,
    profileImageUri,
    pickProfilePicture,
    handleUsernameChange,
    handlePasswordChange,
    handleRegister,
    isRegisterEnabled,
    ...reviewerAccess,
  };
}
