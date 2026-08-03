import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { LinearGradient } from "expo-linear-gradient";
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
const BACKGROUND_GRADIENT_COLORS = [
  colors.createMemoryGradientStart,
  colors.createMemoryGradientEnd,
] as const;

export default function ReadMemoryScreen() {
  const {
    isLoading,
    isSaving,
    memoryState,
    setMemoryState,
    handleSave,
    handleEditMode,
    timeMemoryId,
  } = useReadOrEditMemory();

  if (isLoading) {
    const loadingContent = (
      <LinearGradient
        colors={BACKGROUND_GRADIENT_COLORS}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.container}>
          <LoadingIndicator message="Loading memory..." />
        </SafeAreaView>
      </LinearGradient>
    );
    return loadingContent;
  }

  const headerTitle = format(
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
    <LinearGradient
      colors={BACKGROUND_GRADIENT_COLORS}
      style={styles.gradientBackground}
    >
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <Header title={headerTitle} actionIcons={actionIcons} />
        <Text style={styles.screenHeading}>What Happened</Text>
        <MemoryForm
          storage={memoryState}
          onStorageChange={setMemoryState}
          timeMemoryId={timeMemoryId}
        />
      </SafeAreaView>
    </LinearGradient>
  );
  return content;
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.createMemoryOnGradientTextColor,
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
