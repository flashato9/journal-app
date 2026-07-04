import { Stack } from "expo-router";

export default function MemoriesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="allmemories"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="daymemories"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="creatememory"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
