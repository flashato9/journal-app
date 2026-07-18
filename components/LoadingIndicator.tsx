import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({
  message = "Loading images...",
}: LoadingIndicatorProps) {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
