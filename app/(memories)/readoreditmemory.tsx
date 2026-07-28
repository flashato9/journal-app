import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import MemoryForm from "@/components/memories/MemoryForm";
import { getColors } from "@/constants/colors";
import { useReadOrEditMemory } from "@/hooks/memories/useReadOrEditMemory";

const colors = getColors();

export default function ReadMemoryScreen() {
  const {
    isLoading,
    isSaving,
    memoryState,
    setMemoryState,
    handleSave,
    handleEditMode,
  } = useReadOrEditMemory();

  if (isLoading) {
    const loadingContent = (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator message="Loading memory..." />
      </SafeAreaView>
    );
    return loadingContent;
  }

  const headerTitle = "Daily Memory";
  const captureTimeDisplay = format(
    new Date(memoryState.dateTimeOfCapture),
    "h:mm a",
  ).toLowerCase();

  const actionIcons = memoryState.isEditable ? (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerButton, isSaving && styles.buttonDisabled]}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <MaterialIcons name="save" size={28} color="#007AFF" />
      )}
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={handleEditMode} style={styles.headerButton}>
      <MaterialIcons name="edit" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  const content = (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title={headerTitle} actionIcons={actionIcons} />
      <Text style={styles.screenHeading}>
        {`What Happened - ${captureTimeDisplay}`}
      </Text>
      <MemoryForm storage={memoryState} onStorageChange={setMemoryState} />
    </SafeAreaView>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.createMemoryTitleColor,
    textAlign: "center",
    marginBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.headerChipBackground,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
