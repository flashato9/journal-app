import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert } from "react-native";
import { z } from "zod";
import { useUsernameField } from "@/hooks/welcome/useUsernameField";
import {
  insertUserIntoDB,
  isUserExists,
  setUserPreferredLoginMethod,
} from "@/services/database";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(50, "Password must be at most 50 characters");

export type PreferredAuthMethod = "PASSWORD" | "BIOMETRIC";

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
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [preferredAuthMethod, setPreferredAuthMethod] =
    useState<PreferredAuthMethod>("PASSWORD");

  const handlePasswordChange = (text: string) => {
    setPassword(text);

    // Validate as user types
    if (text === "") {
      setPasswordError("");
      return;
    }

    const result = passwordSchema.safeParse(text);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
    } else {
      setPasswordError("");
    }
  };

  const handleRegister = async () => {
    // Final validation before submit
    if (!validateUsername()) {
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setPasswordError(passwordResult.error.issues[0].message);
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
        if (!isUserExists(username)) {
          const userId = insertUserIntoDB(username);
          setUserPreferredLoginMethod(userId, preferredAuthMethod);
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

  const isRegisterEnabled =
    isUsernameValid && password.length > 0 && passwordError === "";

  return {
    username,
    password,
    usernameError,
    passwordError,
    preferredAuthMethod,
    setPreferredAuthMethod,
    handleUsernameChange,
    handlePasswordChange,
    handleRegister,
    isRegisterEnabled,
  };
}
