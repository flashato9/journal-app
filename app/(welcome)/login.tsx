import { useEffect } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
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
        <Pressable style={styles.pressableFill} onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <PolaroidFrame caption={username} isTilted={false} size={240}>
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
                <Input
                  placeholder="Password"
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
        </Pressable>
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
  pressableFill: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 16,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  buttonWrapper: {
    width: "100%",
  },
});
