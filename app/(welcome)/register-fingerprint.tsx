import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import Header from "../components/Header";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, _, - allowed");

export default function RegisterFingerprintScreen() {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleUsernameChange = (text: string) => {
    setUsername(text);

    if (text === "") {
      setUsernameError("");
      return;
    }

    const result = usernameSchema.safeParse(text);
    if (!result.success) {
      setUsernameError(result.error.issues[0].message);
    } else {
      setUsernameError("");
    }
  };

  const handleFingerprintScan = async () => {
    // Validate username first
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      setUsernameError(result.error.issues[0].message);
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
        promptMessage: "Scan your fingerprint to register",
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

  const isUsernameValid = username.length > 0 && usernameError === "";

  const handleBackToRegister = () => {
    router.push("/(welcome)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" hidden={false} />
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Register with Fingerprint</Text>

          <Text style={styles.subtitle}>
            Enter a username and scan your fingerprint to register
          </Text>

          <TextInput
            style={[styles.input, usernameError ? styles.inputError : {}]}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={handleUsernameChange}
            editable={!isScanning}
            autoComplete="off"
            textContentType="none"
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.fingerprintButton,
              (!isUsernameValid || isScanning) &&
                styles.fingerprintButtonDisabled,
            ]}
            onPress={handleFingerprintScan}
            disabled={!isUsernameValid || isScanning}
            activeOpacity={isUsernameValid && !isScanning ? 0.7 : 1}
          >
            <Text style={styles.fingerprintButtonText}>
              {isScanning ? "Scanning..." : "Scan Fingerprint"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBackToRegister}>
            <Text style={styles.backLink}>Back to Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
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
  inputError: {
    borderColor: "#ff3333",
  },
  errorText: {
    color: "#ff3333",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  fingerprintButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  fingerprintButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  fingerprintButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
