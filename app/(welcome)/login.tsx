import { useVideoPlayer, VideoView } from "expo-video";
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
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import ChevronSwipeLogin from "@/components/welcome/ChevronSwipeLogin";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import PolaroidFrame from "@/components/PolaroidFrame";
import LoginPasswordInput from "@/components/welcome/LoginPasswordInput";
import { getColors } from "@/constants/colors";
import { useCompanionPageSnapshot } from "@/hooks/companion/useCompanionPageSnapshot";
import { useCompanionThread } from "@/hooks/companion/useCompanionThread";
import { useLogin } from "@/hooks/welcome/useLogin";
import { useSwipeUpGesture } from "@/hooks/welcome/useSwipeUpGesture";
import { useVideoLoopLimit } from "@/hooks/welcome/useVideoLoopLimit";
import { useUserSession } from "@/hooks/welcome/useUserSession";
import { CompanionPageSnapshot } from "@/services/companionApi";

const colors = getColors();

// Spike: hardcoded bundled clip to preview a looping video background before building the picker.
const loginBackgroundVideoSource = require("@/assets/videos/snow_flaling.mp4");
const LOGIN_BACKGROUND_VIDEO_MAX_LOOPS = 15;
const POLAROID_SIZE_PX = 240;

export default function LoginScreen() {
  const {
    username: loginUsername,
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
  const backgroundVideoPlayer = useVideoPlayer(
    loginBackgroundVideoSource,
    (player) => {
      player.loop = true;
      player.muted = true;
      player.keepScreenOnWhilePlaying = false;
      player.play();
    },
  );
  useVideoLoopLimit(backgroundVideoPlayer, LOGIN_BACKGROUND_VIDEO_MAX_LOOPS);
  useCompanionThread("login");
  const companionSnapshot: CompanionPageSnapshot = { username: loginUsername };
  useCompanionPageSnapshot("login", companionSnapshot);

  useEffect(() => {
    if (username) setUsername(username);
  }, [username, setUsername]);

  const showBiometricLogin =
    preferredLoginMethod === "BIOMETRIC" && !isBiometricLoginExhausted;
  const { gesture: swipeUpGesture, polaroidSwipeStyle } = useSwipeUpGesture(
    loginWithBiometrics,
    showBiometricLogin,
  );

  const content = (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <VideoView
        player={backgroundVideoPlayer}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />

      <Header title="" containerStyle={styles.transparentHeader} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Pressable style={styles.pressableFill} onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <Animated.View style={[styles.polaroidWrapper, polaroidSwipeStyle]}>
              <PolaroidFrame
                caption={username}
                isTilted={false}
                size={POLAROID_SIZE_PX}
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
            </Animated.View>

            <GestureDetector gesture={swipeUpGesture}>
              <View style={styles.belowPolaroidArea}>
                {showBiometricLogin ? (
                  <View style={styles.chevronLoginWrapper}>
                    {/* <Button
                      text="Login"
                      onPress={loginWithBiometrics}
                      backgroundColor={colors.loginButtonBackground}
                      style={styles.loginButtonPill}
                      shakeTrigger={shakeTrigger}
                    /> */}
                    <ChevronSwipeLogin failureTrigger={shakeTrigger} />
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
            </GestureDetector>
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
  transparentHeader: {
    backgroundColor: "transparent",
    boxShadow: "none",
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
  belowPolaroidArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  chevronLoginWrapper: {
    alignItems: "center",
    marginTop: 44,
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
