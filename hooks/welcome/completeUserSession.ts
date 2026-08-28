import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import type { LocationSettings } from "@/context/AuthContext";
import { logError } from "@/services/appLogger";
import { UserTable } from "@/services/database";
import * as LocationSettingsStore from "@/services/locationSettingsStore";
import { startLocationTracking } from "@/services/locationService";

type AppRouter = ReturnType<typeof useRouter>;
type SetAuthUsername = (username: string | null) => void;
type SetLocationSettings = (settings: LocationSettings | null) => void;

// Loads this user's location settings and pushes them into AuthContext.
function loadLocationSettings(
  userId: number,
  setLocationSettings: SetLocationSettings,
): void {
  const settings = LocationSettingsStore.getLocationSettings(userId);
  setLocationSettings(settings);
}

// Finishes logging a user in after their credentials have already been
// verified (normal password/biometric login, or a matched reviewer-access
// submission): ensures the DB user row exists, loads location settings,
// persists the current username, starts location
// tracking, updates AuthContext, and navigates to the memories list.
export async function completeUserSession(
  username: string,
  setAuthUsername: SetAuthUsername,
  setLocationSettings: SetLocationSettings,
  router: AppRouter,
): Promise<void> {
  try {
    try {
      if (!UserTable.isUserExists(username)) {
        UserTable.insertUserIntoDB(username);
      }
    } catch (dbError) {
      logError("Error creating user in database:", dbError);
    }

    const userId = UserTable.getUserIdByUsername(username);
    if (userId) {
      loadLocationSettings(userId, setLocationSettings);
    }

    await SecureStore.setItemAsync("currentUsername", username);

    try {
      await startLocationTracking();
    } catch (locationError) {
      logError("Error starting location tracking:", locationError);
    }

    setAuthUsername(username);
    router.push("/(memories)/allmemories");
  } catch (error) {
    logError("Error completing user session:", error);
    Alert.alert("Login Failed", "An error occurred. Please try again.");
  }
}
