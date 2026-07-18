import { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import PolaroidFrame from "@/components/PolaroidFrame";
import { useLogin } from "@/hooks/welcome/useLogin";
import { useUserSession } from "@/hooks/welcome/useUserSession";

export default function LoginScreen() {
  const {
    setUsername,
    password,
    setPassword,
    handleLogin,
    loginWithBiometrics,
    isBiometricLoginExhausted,
  } = useLogin();
  const { username, profileImagePath, preferredLoginMethod } = useUserSession();

  useEffect(() => {
    if (username) setUsername(username);
  }, [username, setUsername]);

  const showBiometricLogin =
    preferredLoginMethod === "BIOMETRIC" && !isBiometricLoginExhausted;

  const content = (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <PolaroidFrame caption={username}>
            {profileImagePath ? (
              <Image
                source={{ uri: profileImagePath }}
                style={styles.photoImage}
                resizeMode="cover"
              />
            ) : (
              <LoadingIndicator message="Loading..." />
            )}
          </PolaroidFrame>

          {showBiometricLogin ? (
            <View style={styles.buttonWrapper}>
              <Button
                text="Login"
                onPress={loginWithBiometrics}
                backgroundColor="#007AFF"
              />
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <View style={styles.buttonWrapper}>
                <Button
                  text="Login"
                  onPress={handleLogin}
                  backgroundColor="#007AFF"
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  return content;
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
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  buttonWrapper: {
    width: "100%",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
});
