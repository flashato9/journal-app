import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { useUsernameField } from "@/hooks/welcome/useUsernameField";
import { UserTable } from "@/services/database";

// Custom hook that encapsulates the username change flow: reuses the same
// validated username field as registration, then on save renames the
// SecureStore password key, keeps the location-tracking `currentUsername`
// entry in sync, updates the DB, and updates the live AuthContext session.
export function useChangeUsername() {
  const { username: currentUsername, setUsername: setAuthUsername } =
    useContext(AuthContext);
  const {
    username,
    usernameError,
    handleUsernameChange,
    validateUsername,
    isUsernameValid,
  } = useUsernameField(currentUsername ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUsername || username === currentUsername) return;
    if (!validateUsername()) return;

    setIsSaving(true);
    try {
      const userId = UserTable.getRegisteredUserId();
      if (!userId) return;

      // Move the password to the new SecureStore key.
      const oldKey = `login.${currentUsername}`;
      const newKey = `login.${username}`;
      const password = await SecureStore.getItemAsync(oldKey);
      if (password) {
        await SecureStore.setItemAsync(newKey, password);
        await SecureStore.deleteItemAsync(oldKey);
      }

      // Keep the location-tracking background task's username in sync.
      const storedCurrent = await SecureStore.getItemAsync("currentUsername");
      if (storedCurrent === currentUsername) {
        await SecureStore.setItemAsync("currentUsername", username);
      }

      UserTable.updateUsername(userId, username);
      setAuthUsername(username);
    } catch (error) {
      console.error("Error changing username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    username,
    usernameError,
    handleUsernameChange,
    isSaveEnabled: isUsernameValid && username !== currentUsername,
    isSaving,
    handleSave,
  };
}
