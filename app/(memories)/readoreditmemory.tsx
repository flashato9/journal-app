import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import MemoryForm from "@/components/memories/MemoryForm";
import { useReadOrEditMemory } from "@/hooks/memories/useReadOrEditMemory";

function formatDate(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "h:mmaa MMMM do, yyyy");
  } catch {
    return "Unknown date";
  }
}

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

  const headerTitle = `Memory: ${formatDate(memoryState.dateTimeOfCapture)}`;

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
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} actionIcons={actionIcons} />
      <MemoryForm storage={memoryState} onStorageChange={setMemoryState} />
    </SafeAreaView>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerButton: {
    paddingHorizontal: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
