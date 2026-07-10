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
import { useLogin } from "@/hooks/welcome/useLogin";

export default function LoginScreen() {
  const router = useRouter();
  const {
    username,
    setUsername,
    password,
    setPassword,
    handleLogin,
    loginWithBiometrics,
  } = useLogin();

  const handleRegister = () => {
    router.push("/(welcome)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
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

          <Button
            text="Login"
            onPress={handleLogin}
            backgroundColor="#007AFF"
          />

          <Button
            text="Login with Fingerprint"
            onPress={loginWithBiometrics}
            backgroundColor="#34C759"
          />

          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>Register</Text>
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
  registerLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
