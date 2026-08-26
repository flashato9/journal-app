import { useContext } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CompanionContext } from "@/context/CompanionContext";

export default function CompanionSettings() {
  const { retryConnection } = useContext(CompanionContext);

  const handleRetryConnection = () => {
    retryConnection();
    Alert.alert("Companion", "Retrying connection...");
  };

  const content = (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetryConnection}
      >
        <Text style={styles.retryButtonText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
