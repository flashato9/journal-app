import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { usePasswordField } from "@/hooks/welcome/usePasswordField";

// Custom hook that encapsulates the password change flow: the current
// password is just compared against SecureStore (no format validation),
// the new password reuses the same validated field as registration.
export function useChangePassword() {
  const { username } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const {
    password: newPassword,
    passwordError,
    handlePasswordChange,
    validatePassword,
    isPasswordValid,
    resetPassword,
  } = usePasswordField();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!username) return;
    if (!validatePassword()) return;

    setIsSaving(true);
    try {
      const key = `login.${username}`;
      const storedPassword = await SecureStore.getItemAsync(key);

      if (storedPassword !== currentPassword) {
        Alert.alert(
          "Incorrect Password",
          "Your current password is incorrect.",
        );
        return;
      }

      await SecureStore.setItemAsync(key, newPassword);

      setCurrentPassword("");
      resetPassword();
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    passwordError,
    handlePasswordChange,
    isSaveEnabled: isPasswordValid,
    isSaving,
    handleSave,
  };
}
