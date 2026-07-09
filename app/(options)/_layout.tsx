import { Stack } from "expo-router";

export default function OptionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="location-settings" />
      <Stack.Screen name="debug-logs" />
    </Stack>
  );
}
