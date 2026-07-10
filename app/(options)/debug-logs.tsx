import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { useDebugLogs } from "@/hooks/options/useDebugLogs";

export default function DebugLogsScreen() {
  const {
    scrollViewRef,
    handleScroll,
    logs,
    handleRefreshLogs,
    handleClearLogs,
    handleExportLogs,
  } = useDebugLogs();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Debug Logs" />

      {/* Logs Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.logsContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.logsText}>{logs}</Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefreshLogs}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.exportButton]}
          onPress={handleExportLogs}
        >
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearLogs}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
  },
  logsText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    backgroundColor: "#007AFF",
  },
  exportButton: {
    backgroundColor: "#34C759",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
