import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { completeUserSession } from "@/hooks/welcome/completeUserSession";
import { logError, logInfo, logWarn } from "@/services/appLogger";

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
  const [loginError, setLoginError] = useState("");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const { setUsername: setAuthUsername, setLocationSettings } =
    useContext(AuthContext);

  // Shows an inline login error and re-triggers the Login button's shake.
  const showLoginFailure = (message: string) => {
    setLoginError(message);
    setShakeTrigger((previousShakeTrigger) => previousShakeTrigger + 1);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setLoginError("");
  };

  // Core auth check shared by password login and biometric login.
  const authenticate = async (username: string, credential: string) => {
    try {
      const key = `login.${username}`;

      // Check if username exists and credential matches
      const storedCredential = await SecureStore.getItemAsync(key);

      if (!storedCredential || storedCredential !== credential) {
        const failureContext = { username };
        logWarn("Login failed: invalid username or password", failureContext);
        showLoginFailure("Invalid username or password.");
        return;
      }

      logInfo("Login successful:", { username });
      await completeUserSession(
        username,
        setAuthUsername,
        setLocationSettings,
        router,
      );
    } catch (error) {
      logError("Error during login:", error);
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
            logWarn("Login failed: no fingerprint registration");
            showLoginFailure(
              "Fingerprint registration not found for this user.",
            );
            return;
          }

          await authenticate(username, storedToken);
          return;
        }
      } catch (error) {
        logError(`Error during biometric login attempt ${attempt}:`, error);
        showLoginFailure("Biometric login failed. Please try again.");
      }
    }

    setIsBiometricLoginExhausted(true);
  };

  // Validate the form fields, then log in with the entered credentials.
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showLoginFailure("Please enter both username and password.");
      return;
    }

    await authenticate(username, password);
  };

  return {
    username,
    setUsername,
    password,
    handlePasswordChange,
    loginError,
    shakeTrigger,
    handleLogin,
    loginWithBiometrics,
    isBiometricLoginExhausted,
  };
}
