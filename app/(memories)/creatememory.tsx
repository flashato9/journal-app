import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import MemoryForm from "@/components/memories/MemoryForm";
import { useCreateMemory } from "@/hooks/memories/useCreateMemory";

export default function CreateMemoryScreen() {
  const { memoryState, setMemoryState, isSaving, handleSave } =
    useCreateMemory();

  const headerTitle = `Memory: ${format(new Date(memoryState.dateTimeOfCapture), "h:mmaa MMMM do, yyyy")}`;

  const actionIcons = (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerSaveButton, isSaving && styles.buttonDisabled]}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <MaterialIcons name="save" size={28} color="#007AFF" />
      )}
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
  headerSaveButton: {
    marginRight: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
