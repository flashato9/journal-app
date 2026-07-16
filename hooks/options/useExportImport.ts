import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useContext, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { applyImportZip, buildExportZip } from "@/services/backupService";
import { getUserIdByUsername } from "@/services/database";

// Owns the Backup & Restore section: building an export zip and handing it to
// the OS share sheet, and picking a backup file to import back in.
export function useExportImport() {
  const { username } = useContext(AuthContext);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!username) {
        Alert.alert("Error", "User session has ended. Please log back in.");
        return;
      }

      const userId = getUserIdByUsername(username);
      if (!userId) {
        throw new Error(`User not found in database: ${username}`);
      }

      const zipUri = await buildExportZip(userId);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Backup created",
          "Sharing isn't available on this device, so the backup couldn't be sent anywhere.",
        );
        return;
      }

      await Sharing.shareAsync(zipUri, {
        mimeType: "application/zip",
        dialogTitle: "Save your journal backup",
        UTI: "public.zip-archive",
      });
    } catch (error) {
      console.error("Error exporting backup:", error);
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "Could not create the backup",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const runImport = async (zipUri: string) => {
    setIsImporting(true);
    try {
      await applyImportZip(zipUri);
      Alert.alert(
        "Import complete",
        "Your data has been restored. Reopen your memories to see it.",
      );
    } catch (error) {
      console.error("Error importing backup:", error);
      Alert.alert(
        "Import failed",
        error instanceof Error ? error.message : "Could not read that backup",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Android reports zips under either type depending on the source app.
        type: ["application/zip", "application/x-zip-compressed"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      // Importing merges into existing data and can replace memories the
      // backup has newer versions of, so make that explicit before starting.
      Alert.alert(
        "Restore this backup?",
        `"${asset.name}" will be merged into your data. Memories that are newer in the backup will replace the ones on this device.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restore", onPress: () => runImport(asset.uri) },
        ],
      );
    } catch (error) {
      console.error("Error picking backup file:", error);
      Alert.alert("Error", "Could not open the file picker");
    }
  };

  return { isExporting, isImporting, handleExport, handleImport };
}
