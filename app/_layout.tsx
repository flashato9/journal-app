import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import { initializeDatabase } from "../services/database";
import { initializeLogger } from "../services/logger";
import LoadingIndicator from "@/components/LoadingIndicator";
import OptionsMenu from "@/components/OptionsMenu";
import { useBreakNotificationNavigation } from "@/hooks/notifications/useBreakNotificationNavigation";
import { useSharedMediaNavigation } from "@/hooks/shareIntent/useSharedMediaNavigation";

// Starts the logger first so it can capture logs from database init.
async function initializeApp(setIsDbReady: (isReady: boolean) => void) {
  await initializeLogger();
  await initializeDatabase();
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
  );
  return content;
}

export default function RootLayout() {
  const content = (
    <ShareIntentProvider>
      <AuthProvider>
        <OptionsMenuProvider>
          <RootLayoutContent />
          <OptionsMenu />
        </OptionsMenuProvider>
      </AuthProvider>
    </ShareIntentProvider>
  );
  return content;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
