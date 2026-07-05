import { createContext, ReactNode, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
  isBiometricAvailable: boolean;
  setIsBiometricAvailable: (available: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  setUsername: () => {},
  isBiometricAvailable: false,
  setIsBiometricAvailable: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        username,
        setUsername,
        isBiometricAvailable,
        setIsBiometricAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to check if biometric is available
export const checkBiometricAvailability = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric availability:", error);
    return false;
  }
};

// Helper function to authenticate with biometric
export const authenticateWithBiometric = async (
  reason: string
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason,
    });
    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
};

// Helper to save last username for biometric login
export const saveLastUsername = async (username: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync("lastUsername", username);
  } catch (error) {
    console.error("Error saving last username:", error);
  }
};

// Helper to get last username for biometric login
export const getLastUsername = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("lastUsername");
  } catch (error) {
    console.error("Error retrieving last username:", error);
    return null;
  }
};

// Helper to clear last username on logout
export const clearLastUsername = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("lastUsername");
  } catch (error) {
    console.error("Error clearing last username:", error);
  }
};
