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
    initializeDatabase().then(() => {
      setIsDbReady(true);
    });
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <Stack key={username ? "authenticated" : "unauthenticated"}>
      {username ? (
        <Stack.Screen
          name="(memories)"
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="(welcome)"
          options={{
            headerShown: false,
          }}
        />
      )}
      <Stack.Screen
        name="(options)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize file-based logging for testing
    initializeLogger();
  }, []);

  return (
    <AuthProvider>
      <OptionsMenuProvider>
        <RootLayoutContent />
        <OptionsMenu />
      </OptionsMenuProvider>
    </AuthProvider>
  );
}
