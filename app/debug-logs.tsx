import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { clearLogs, readLogs } from "../services/logger";
import Header from "./components/Header";

export default function DebugLogsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      console.log("📋 Loading debug logs...");
      setLoading(true);
      const logContent = await readLogs();
      setLogs(logContent || "No logs yet");
      console.log("✅ Debug logs loaded successfully");
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch (error) {
      console.log("❌ Error loading debug logs:", error);
      setLogs(`Error reading logs: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await clearLogs();
      setLogs("Logs cleared");
      setTimeout(() => loadLogs(), 500);
    } catch (error) {
      setLogs(`Error clearing logs: ${error}`);
    }
  };

  const handleExportLogs = async () => {
    try {
      console.log("📤 Exporting logs...");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const exportFile = new File(
        Paths.document,
        `app-logs-export-${timestamp}.txt`,
      );
      await exportFile.write(logs);
      console.log("✅ Logs exported successfully to:", exportFile.uri);
      setLogs(`✅ Logs exported\n\n${logs}`);
    } catch (error) {
      console.log("❌ Error exporting logs:", error);
      setLogs(`❌ Error exporting logs: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Debug Logs" />

      {/* Logs Content */}
      <ScrollView ref={scrollViewRef} style={styles.logsContainer}>
        <Text style={styles.logsText}>{logs}</Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={loadLogs}
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
    </View>
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
