import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useContext } from "react";
import { Alert, BackHandler } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { stopLocationTracking } from "@/services/locationService";

type AppRouter = ReturnType<typeof useRouter>;

// Stops location tracking, clears the session, and returns to the login screen.
async function logout(
  setUsername: (username: string | null) => void,
  router: AppRouter,
) {
  try {
    await stopLocationTracking();
  } catch (error) {
    console.error("Error stopping location tracking:", error);
  }

  try {
    await SecureStore.deleteItemAsync("currentUsername");
  } catch (error) {
    console.error("Error clearing username from SecureStore:", error);
  }

  setUsername(null);
  router.replace("/(welcome)/login");
}

// Confirms with the user, then logs out, when the hardware back button is pressed.
function confirmLogout(
  setUsername: (username: string | null) => void,
  router: AppRouter,
) {
  Alert.alert("Logout?", "Going back will log you out. Continue?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      onPress: () => logout(setUsername, router),
      style: "destructive",
    },
  ]);
}

// Intercepts the Android hardware back button to confirm logout before navigating away.
export function useLogoutOnBackPress() {
  const router = useRouter();
  const { setUsername } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        confirmLogout(setUsername, router);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      const cleanup = () => subscription.remove();
      return cleanup;
    }, [router, setUsername]),
  );
}
