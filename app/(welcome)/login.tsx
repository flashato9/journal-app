import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { insertUserIntoDB, isUserExists } from "../../services/database";
import { startLocationTracking } from "../../services/locationService";
import Header from "../components/Header";

// Helper function to perform login with username and credential (password or token)
const performLogin = async (
  username: string,
  credential: string,
  setAuthUsername: (username: string) => void,
  router: any,
) => {
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

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUsername: setAuthUsername } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    await performLogin(username, password, setAuthUsername, router);
  };

  const handleRegister = () => {
    router.push("/(welcome)/register");
  };

  const handleBiometricLogin = async () => {
    try {
      // Trigger biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: "Scan your fingerprint to login",
      });

      if (authResult.success) {
        // Retrieve the username associated with this fingerprint
        const storedUsername =
          await SecureStore.getItemAsync("biometric.username");

        if (!storedUsername) {
          Alert.alert(
            "No Fingerprint Registration",
            "No fingerprint registration found. Please register with fingerprint first.",
          );
          return;
        }

        // Retrieve the stored token for this username
        const key = `login.${storedUsername}`;
        const storedToken = await SecureStore.getItemAsync(key);

        if (!storedToken) {
          Alert.alert(
            "No Fingerprint Registration",
            "Fingerprint registration not found for this user.",
          );
          return;
        }

        // Use the helper function to complete login with username and token
        await performLogin(
          storedUsername,
          storedToken,
          setAuthUsername,
          router,
        );
      } else {
        Alert.alert(
          "Fingerprint Failed",
          "Fingerprint recognition failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error during biometric login:", error);
      Alert.alert("Login Failed", "An error occurred. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      {/* Centered Login Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          editable={true}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
        >
          <Text style={styles.biometricButtonText}>Login with Fingerprint</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  biometricButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  biometricButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
