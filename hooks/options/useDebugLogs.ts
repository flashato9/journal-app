import { File, Paths } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";
import { clearLogs, readLogs } from "@/services/logger";

// How close to the bottom (in px) still counts as "at the bottom".
const BOTTOM_THRESHOLD = 40;

// Custom hook that owns the debug logs screen: loading/auto-refreshing
// log content, and the refresh/clear/export actions.
export function useDebugLogs() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [logs, setLogs] = useState<string>("");
  const lastInteractionRef = useRef<number>(Date.now());
  // Stick-to-bottom: only auto-scroll on new content if the user is
  // already at the bottom, like a terminal following `tail -f`.
  const isAtBottomRef = useRef(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    isAtBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
  };

  const loadLogs = async (isManual: boolean = false) => {
    if (isManual) {
      lastInteractionRef.current = Date.now();
      console.log("📋 Loading debug logs...");
    }
    try {
      const logContent = await readLogs();
      setLogs(logContent || "No logs yet");
      if (isManual) {
        console.log("✅ Debug logs loaded successfully");
      }
      if (isAtBottomRef.current) {
        setTimeout(
          () => scrollViewRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      }
    } catch (error) {
      console.log("❌ Error loading debug logs:", error);
      setLogs(`Error reading logs: ${error}`);
    }
  };

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

  const handleRefreshLogs = () => loadLogs(true);

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

  return {
    scrollViewRef,
    handleScroll,
    logs,
    handleRefreshLogs,
    handleClearLogs,
    handleExportLogs,
  };
}
