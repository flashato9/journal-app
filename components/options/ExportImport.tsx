import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useExportImport } from "@/hooks/options/useExportImport";

export default function ExportImport() {
  const { isExporting, isImporting, handleExport, handleImport } =
    useExportImport();

  const busy = isExporting || isImporting;

  const content = (
    <View style={styles.content}>
      <View style={styles.setting}>
        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleExport}
          disabled={busy}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Export Backup</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.description}>
          Saves a .zip snapshot of your memories, media, and settings, then lets
          you send it to Drive, Files, or anywhere else. Keep it somewhere safe
          — it&apos;s how you get your data back after reinstalling.
        </Text>
      </View>

      <View style={styles.setting}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.importButton,
            busy && styles.buttonDisabled,
          ]}
          onPress={handleImport}
          disabled={busy}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Import Backup</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.description}>
          Restores a backup .zip. Anything missing here is added; memories that
          are newer in the backup replace the ones on this device.
        </Text>
      </View>

      <Text style={styles.note}>
        Your password isn&apos;t included in a backup — you&apos;ll log in as
        usual after restoring.
      </Text>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  setting: {
    gap: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  importButton: {
    backgroundColor: "#34C759",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: "#666",
  },
  note: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
