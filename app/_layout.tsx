import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import { initializeDatabase } from "../services/database";
import LoadingIndicator from "./components/LoadingIndicator";
import OptionsMenu from "./components/OptionsMenu";

export default function RootLayout() {
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
    <AuthProvider>
      <OptionsMenuProvider>
        <Stack>
          <Stack.Screen
            name="(welcome)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(memories)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <OptionsMenu />
      </OptionsMenuProvider>
    </AuthProvider>
  );
}
