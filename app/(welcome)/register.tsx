import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import Header from "@/components/Header";

// Validation schemas
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, _, - allowed");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(50, "Password must be at most 50 characters");

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const handleUsernameChange = (text: string) => {
    setUsername(text);

    // Validate as user types
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

  const handlePasswordChange = (text: string) => {
    setPassword(text);

    // Validate as user types
    if (text === "") {
      setPasswordError("");
      return;
    }

    const result = passwordSchema.safeParse(text);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
    } else {
      setPasswordError("");
    }
  };

  const handleRegister = async () => {
    // Final validation before submit
    const usernameResult = usernameSchema.safeParse(username);
    const passwordResult = passwordSchema.safeParse(password);

    if (!usernameResult.success) {
      setUsernameError(usernameResult.error.issues[0].message);
      return;
    }

    if (!passwordResult.success) {
      setPasswordError(passwordResult.error.issues[0].message);
      return;
    }

    try {
      const key = `login.${username}`;

      // Check if username already exists
      const existingPassword = await SecureStore.getItemAsync(key);
      if (existingPassword) {
        Alert.alert(
          "Username Already Registered",
          "This username is already taken. Please try another one or go to login.",
        );
        return;
      }

      // Store password in SecureStore with namespace login.<username>
      await SecureStore.setItemAsync(key, password);

      console.log("Registration successful:", { username, storedIn: key });

      Alert.alert("Success", "Account created! Please log in.");
      router.push("/(welcome)/login");
    } catch (error) {
      console.error("Error during registration:", error);
      Alert.alert(
        "Registration Failed",
        "An error occurred during registration. Please try again.",
      );
    }
  };

  const isRegisterEnabled =
    username.length > 0 &&
    password.length > 0 &&
    usernameError === "" &&
    passwordError === "";

  const handleBackToLogin = () => {
    router.push("/(welcome)/login");
  };

  const handleBiometricRegister = () => {
    console.log("Register with fingerprint clicked");
    router.push("/(welcome)/register-fingerprint");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={[styles.input, usernameError ? styles.inputError : {}]}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={handleUsernameChange}
            editable={true}
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}

          <TextInput
            style={[styles.input, passwordError ? styles.inputError : {}]}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={true}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.registerButton,
              !isRegisterEnabled && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isRegisterEnabled}
            activeOpacity={isRegisterEnabled ? 0.7 : 1}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricRegister}
          >
            <Text style={styles.biometricButtonText}>
              Register with Fingerprint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.loginLink}>Back to Login</Text>
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
    marginBottom: 24,
    textAlign: "center",
    color: "#000",
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
  registerButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  registerButtonText: {
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
  loginLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
