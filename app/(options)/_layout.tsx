import { Stack } from "expo-router";

export default function OptionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="debug-logs" />
      <Stack.Screen name="profile-settings" />
    </Stack>
  );
}
