import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import type { LocationSettings } from "@/context/AuthContext";
import { LocationSettingsTable, UserTable } from "@/services/database";
import { startLocationTracking } from "@/services/locationService";

type AppRouter = ReturnType<typeof useRouter>;
type SetAuthUsername = (username: string | null) => void;
type SetLocationSettings = (settings: LocationSettings | null) => void;

// Loads this user's LocationSettings row (creating dummy defaults if
// missing) and pushes it into AuthContext.
async function loadLocationSettings(
  userId: number,
  setLocationSettings: SetLocationSettings,
): Promise<void> {
  let settings = LocationSettingsTable.getLocationSettingsByUserId(userId);
  if (!settings) {
    LocationSettingsTable.createLocationSettings(userId, 10, 1, 10);
    settings = LocationSettingsTable.getLocationSettingsByUserId(userId);
  }
  if (!settings) return;

  const loadedSettings = {
    fetchFrequency: settings.fetchFrequency,
    notificationThreshold: settings.notificationThreshold,
    restThreshold: settings.restThreshold,
    locationTrackingPollFrequency: settings.locationTrackingPollFrequency,
  };
  setLocationSettings(loadedSettings);
}

// Finishes logging a user in after their credentials have already been
// verified (normal password/biometric login, or a matched reviewer-access
// submission): ensures the DB user row exists, loads/creates
// LocationSettings, persists the current username, starts location
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
      console.error("Error creating user in database:", dbError);
    }

    const userId = UserTable.getUserIdByUsername(username);
    if (userId) {
      await loadLocationSettings(userId, setLocationSettings);
    }

    await SecureStore.setItemAsync("currentUsername", username);

    try {
      await startLocationTracking();
    } catch (locationError) {
      console.error("Error starting location tracking:", locationError);
    }

    setAuthUsername(username);
    router.push("/(memories)/allmemories");
  } catch (error) {
    console.error("Error completing user session:", error);
    Alert.alert("Login Failed", "An error occurred. Please try again.");
  }
}
