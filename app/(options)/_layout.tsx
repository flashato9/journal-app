import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function OptionsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="location-settings"
        options={{
          title: "Location",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="location-on" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debug-logs"
        options={{
          title: "Debug Logs",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bug-report" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
