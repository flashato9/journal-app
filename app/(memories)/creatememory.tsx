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
import MemoryForm from "@/components/memories/MemoryForm";
import { getColors } from "@/constants/colors";
import { useCreateMemory } from "@/hooks/memories/useCreateMemory";

const colors = getColors();

export default function CreateMemoryScreen() {
  const {
    memoryState,
    setMemoryState,
    isSaving,
    handleSave,
    handleRetryLocation,
  } = useCreateMemory();

  const headerTitle = "Daily Memory";
  const captureTimeDisplay = format(
    new Date(memoryState.dateTimeOfCapture),
    "h:mm a",
  ).toLowerCase();

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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title={headerTitle} actionIcons={actionIcons} />
      <Text style={styles.screenHeading}>
        {`What's Happening - ${captureTimeDisplay}`}
      </Text>
      <MemoryForm
        storage={memoryState}
        onStorageChange={setMemoryState}
        onRetryLocation={handleRetryLocation}
      />
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
  headerSaveButton: {
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
