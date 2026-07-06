import { Stack } from "expo-router";

export default function MemoriesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="allmemories" />
      <Stack.Screen name="daymemories" />
      <Stack.Screen name="creatememory" />
      <Stack.Screen name="readoreditmemory" />
    </Stack>
  );
}
