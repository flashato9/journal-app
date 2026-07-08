import { File, Paths } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearLogs, readLogs } from "@/services/logger";
import Header from "@/components/Header";

export default function DebugLogsScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [logs, setLogs] = useState<string>("");
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    loadLogs();
  }, []);

  // Auto-refresh logs every 5 seconds if no button pressed
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      // Only auto-refresh if no button was pressed in the last 5 seconds
      if (timeSinceLastInteraction >= 5000) {
        loadLogs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadLogs = async (isManual: boolean = false) => {
    try {
      if (isManual) {
        console.log("📋 Loading debug logs...");
      }
      const logContent = await readLogs();
      setLogs(logContent || "No logs yet");
      if (isManual) {
        console.log("✅ Debug logs loaded successfully");
      }
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch (error) {
      console.log("❌ Error loading debug logs:", error);
      setLogs(`Error reading logs: ${error}`);
    }
  };

  const handleClearLogs = async () => {
    lastInteractionRef.current = Date.now();
    try {
      await clearLogs();
      setLogs("Logs cleared");
      setTimeout(() => loadLogs(), 500);
    } catch (error) {
      setLogs(`Error clearing logs: ${error}`);
    }
  };

  const handleExportLogs = async () => {
    lastInteractionRef.current = Date.now();
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
      <Header title="Debug Logs" useSafeArea={true} />

      {/* Logs Content */}
      <ScrollView ref={scrollViewRef} style={styles.logsContainer}>
        <Text style={styles.logsText}>{logs}</Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={() => {
            lastInteractionRef.current = Date.now();
            loadLogs(true);
          }}
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
