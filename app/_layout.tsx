import { Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import { initializeDatabase } from "../services/database";
import { initializeLogger } from "../services/logger";
import LoadingIndicator from "@/components/LoadingIndicator";
import OptionsMenu from "@/components/OptionsMenu";

function RootLayoutContent() {
  const { username } = useContext(AuthContext);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Start the logger first so it can capture logs from database init
      await initializeLogger();
      await initializeDatabase();
      setIsDbReady(true);
    };
    initialize();
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <Stack
      key={username ? "authenticated" : "unauthenticated"}
      screenOptions={{ headerShown: false }}
    >
      {username ? (
        <Stack.Screen name="(memories)" />
      ) : (
        <Stack.Screen name="(welcome)" />
      )}
      <Stack.Screen name="(options)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OptionsMenuProvider>
        <RootLayoutContent />
        <OptionsMenu />
      </OptionsMenuProvider>
    </AuthProvider>
  );
}
