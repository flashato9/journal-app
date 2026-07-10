import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { useRegister } from "@/hooks/welcome/useRegister";

export default function RegisterScreen() {
  const router = useRouter();
  const {
    username,
    password,
    usernameError,
    passwordError,
    handleUsernameChange,
    handlePasswordChange,
    handleRegister,
    isRegisterEnabled,
  } = useRegister();

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
