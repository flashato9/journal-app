import { Stack } from "expo-router";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import OptionsMenu from "./components/OptionsMenu";

export default function RootLayout() {
  return (
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
  );
}
