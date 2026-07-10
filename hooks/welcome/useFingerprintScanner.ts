import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert } from "react-native";

// Custom hook that encapsulates fingerprint registration: biometric
// scan, token generation, and SecureStore storage. Takes the already
// validated username and a final-check validator from the caller
// (see useUsernameField), so it only owns the scanning flow itself.
export function useFingerprintScanner(
  username: string,
  validateUsername: () => boolean,
) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleFingerprintScan = async () => {
    // Validate username first
    if (!validateUsername()) {
      return;
    }

    try {
      const key = `login.${username}`;

      // Check if username already exists
      const existingEntry = await SecureStore.getItemAsync(key);
      if (existingEntry) {
        Alert.alert(
          "Username Already Registered",
          "This username is already taken. Please try another one.",
        );
        return;
      }

      // Start scanning
      setIsScanning(true);

      // Authenticate with biometric
      const authResult = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: "Please scan your fingerprint to register",
      });

      if (authResult.success) {
        // Generate a random token
        const token = `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;

        // Store username with token in SecureStore
        await SecureStore.setItemAsync(key, token);

        // Also store the username so we can retrieve it on fingerprint login
        await SecureStore.setItemAsync("biometric.username", username);

        console.log("Fingerprint registration successful:", { username });

        Alert.alert(
          "Success",
          "Fingerprint registered! You can now log in with your fingerprint.",
        );
        router.push("/(welcome)/login");
      } else {
        Alert.alert(
          "Fingerprint Failed",
          "Fingerprint recognition failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error during fingerprint registration:", error);
      Alert.alert(
        "Registration Failed",
        "An error occurred. Please try again.",
      );
    } finally {
      setIsScanning(false);
    }
  };

  return { isScanning, handleFingerprintScan };
}
