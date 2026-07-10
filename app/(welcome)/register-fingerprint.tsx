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
import Button from "@/components/Button";
import Header from "@/components/Header";
import { useFingerprintScanner } from "@/hooks/welcome/useFingerprintScanner";
import { useUsernameField } from "@/hooks/welcome/useUsernameField";

export default function RegisterFingerprintScreen() {
  const {
    username,
    usernameError,
    handleUsernameChange,
    validateUsername,
    isUsernameValid,
  } = useUsernameField();
  const { isScanning, handleFingerprintScan } = useFingerprintScanner(
    username,
    validateUsername,
  );
  const router = useRouter();

  const handleBackToRegister = () => {
    router.push("/(welcome)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
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

          <Button
            text="Scan Fingerprint"
            onPress={handleFingerprintScan}
            backgroundColor="#34C759"
            disabled={!isUsernameValid}
          />

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
  backLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
