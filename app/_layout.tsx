import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import { initializeDatabase } from "../services/database";
import { warmPlaceholderProfilePictureAsset } from "../services/profilePictureStorage";
import CompanionChatPopover from "@/components/CompanionChatPopover";
import CompanionIcon from "@/components/CompanionIcon";
import CompanionPopup from "@/components/CompanionPopup";
import LoadingIndicator from "@/components/LoadingIndicator";
import { CompanionProvider } from "@/context/CompanionContext";
import { useBreakNotificationNavigation } from "@/hooks/notifications/useBreakNotificationNavigation";
import { useSharedMediaNavigation } from "@/hooks/shareIntent/useSharedMediaNavigation";

async function initializeApp(setIsDbReady: (isReady: boolean) => void) {
  await initializeDatabase();
  await warmPlaceholderProfilePictureAsset();
  setIsDbReady(true);
}

function RootLayoutContent() {
  const { isLoggedIn } = useContext(AuthContext);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeApp(setIsDbReady);
  }, []);

  useBreakNotificationNavigation();
  useSharedMediaNavigation();

  if (!isDbReady) {
    const loadingContent = (
      <View style={styles.loadingContainer}>
        <LoadingIndicator />
      </View>
    );
    return loadingContent;
  }

  const content = (
    <>
      <Stack
        key={isLoggedIn ? "authenticated" : "unauthenticated"}
        screenOptions={{ headerShown: false }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="(memories)" />
        ) : (
          <Stack.Screen name="(welcome)" />
        )}
        <Stack.Screen name="(options)" />
      </Stack>
      {/* <CompanionIcon /> */}
      <CompanionPopup />
      <CompanionChatPopover />
    </>
  );
  return content;
}

export default function RootLayout() {
  const content = (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <ShareIntentProvider>
          <AuthProvider>
            <OptionsMenuProvider>
              <ActionSheetProvider>
                <CompanionProvider>
                  <RootLayoutContent />
                </CompanionProvider>
              </ActionSheetProvider>
            </OptionsMenuProvider>
          </AuthProvider>
        </ShareIntentProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
  return content;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
