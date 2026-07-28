import { useEffect } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import PolaroidFrame from "@/components/PolaroidFrame";
import LoginPasswordInput from "@/components/welcome/LoginPasswordInput";
import { getColors } from "@/constants/colors";
import { useLogin } from "@/hooks/welcome/useLogin";
import { useUserSession } from "@/hooks/welcome/useUserSession";

const colors = getColors();

export default function LoginScreen() {
  const {
    setUsername,
    password,
    handlePasswordChange,
    loginError,
    shakeTrigger,
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Pressable style={styles.pressableFill} onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <View style={styles.polaroidWrapper}>
              <PolaroidFrame
                caption={username}
                isTilted={false}
                size={240}
                onPress={Keyboard.dismiss}
              >
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
            </View>

            {showBiometricLogin ? (
              <View style={styles.buttonWrapper}>
                <Button
                  text="Login"
                  onPress={loginWithBiometrics}
                  backgroundColor={colors.loginButtonBackground}
                  style={styles.loginButtonPill}
                  shakeTrigger={shakeTrigger}
                />
              </View>
            ) : (
              <>
                <LoginPasswordInput
                  value={password}
                  onChangeText={handlePasswordChange}
                />
                <View style={styles.buttonWrapper}>
                  <Button
                    text="Login"
                    onPress={handleLogin}
                    backgroundColor={colors.loginButtonBackground}
                    style={styles.loginButtonPill}
                    shakeTrigger={shakeTrigger}
                  />
                </View>
              </>
            )}

            {loginError ? (
              <Text style={styles.loginErrorText}>{loginError}</Text>
            ) : null}
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
    backgroundColor: colors.screenBackground,
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
    paddingTop: 56,
    gap: 16,
  },
  polaroidWrapper: {
    marginBottom: 48,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 12,
  },
  loginButtonPill: {
    borderRadius: 999,
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)",
  },
  loginErrorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
  },
});
