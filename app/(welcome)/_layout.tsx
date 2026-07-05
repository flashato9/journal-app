import { Stack } from "expo-router";

export default function WelcomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register-fingerprint"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
