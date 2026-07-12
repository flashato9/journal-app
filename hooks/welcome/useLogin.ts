import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import {
  createLocationSettings,
  getLocationSettingsByUserId,
  getUserIdByUsername,
  insertUserIntoDB,
  isUserExists,
} from "@/services/database";
import { startLocationTracking } from "@/services/locationService";

// Custom hook that encapsulates the login flow (form state, validation,
// auth check, DB sync, location settings load, and location tracking
// start). Reads AuthContext and the router directly, so the screen only
// wires up UI.
const MAX_BIOMETRIC_ATTEMPTS = 3;

export function useLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isBiometricLoginExhausted, setIsBiometricLoginExhausted] =
    useState(false);
  const { setUsername: setAuthUsername, setLocationSettings } =
    useContext(AuthContext);

  // Core auth check shared by password login and biometric login.
  const authenticate = async (username: string, credential: string) => {
    try {
      const key = `login.${username}`;

      // Check if username exists and credential matches
      const storedCredential = await SecureStore.getItemAsync(key);

      if (!storedCredential || storedCredential !== credential) {
        Alert.alert("Login Failed", "Invalid username or password.");
        return;
      }

      // Login successful - ensure user exists in database
      console.log("Login successful:", { username });
      try {
        if (!isUserExists(username)) {
          insertUserIntoDB(username);
        }
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
      }

      // Get userId and fetch/create LocationSettings
      const userId = getUserIdByUsername(username);
      if (userId) {
        let settings = getLocationSettingsByUserId(userId);
        if (!settings) {
          // Create dummy settings (10, 1, 10)
          createLocationSettings(userId, 10, 1, 10);
          settings = getLocationSettingsByUserId(userId);
        }
        if (settings) {
          setLocationSettings({
            fetchFrequency: settings.fetchFrequency,
            notificationThreshold: settings.notificationThreshold,
            restThreshold: settings.restThreshold,
            locationTrackingPollFrequency:
              settings.locationTrackingPollFrequency,
          });
          console.log("Location settings loaded:", settings);
        }
      }

      // Store current username in SecureStore for location tracking
      await SecureStore.setItemAsync("currentUsername", username);

      // Start location tracking
      try {
        await startLocationTracking();
        console.log("Location tracking started for user:", username);
      } catch (locationError) {
        console.error("Error starting location tracking:", locationError);
        // Don't fail login if location tracking fails - just log it
      }

      setAuthUsername(username);
      router.push("/(memories)/allmemories");
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Login Failed", "An error occurred. Please try again.");
    }
  };

  // Authenticate with the device biometric for the current username, retrying
  // up to MAX_BIOMETRIC_ATTEMPTS times. If every attempt fails, sets
  // isBiometricLoginExhausted so the screen can fall back to a password.
  const loginWithBiometrics = async () => {
    if (!username) return;

    setIsBiometricLoginExhausted(false);

    for (let attempt = 1; attempt <= MAX_BIOMETRIC_ATTEMPTS; attempt++) {
      try {
        const authResult = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
          promptMessage: "Scan your fingerprint to login",
        });

        if (authResult.success) {
          const key = `login.${username}`;
          const storedToken = await SecureStore.getItemAsync(key);

          if (!storedToken) {
            Alert.alert(
              "No Fingerprint Registration",
              "Fingerprint registration not found for this user.",
            );
            return;
          }

          await authenticate(username, storedToken);
          return;
        }
      } catch (error) {
        console.error(
          `Error during biometric login attempt ${attempt}:`,
          error,
        );
        Alert.alert("Biometric Login Failed", "Please try again.");
      }
    }

    setIsBiometricLoginExhausted(true);
  };

  // Validate the form fields, then log in with the entered credentials.
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    await authenticate(username, password);
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    handleLogin,
    loginWithBiometrics,
    isBiometricLoginExhausted,
  };
}
