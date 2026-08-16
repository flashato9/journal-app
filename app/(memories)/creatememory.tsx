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
import MemoryForm from "@/components/memories/MemoryForm";
import { getColors } from "@/constants/colors";
import { useCompanionPageSnapshot } from "@/hooks/companion/useCompanionPageSnapshot";
import { useCompanionThread } from "@/hooks/companion/useCompanionThread";
import { useCreateMemory } from "@/hooks/memories/useCreateMemory";
import { CompanionPageSnapshot } from "@/services/companionApi";

const colors = getColors();
const BACKGROUND_GRADIENT_COLORS = [
  colors.createMemoryGradientStart,
  colors.createMemoryGradientEnd,
] as const;

export default function CreateMemoryScreen() {
  const {
    memoryState,
    setMemoryState,
    isSaving,
    handleSave,
    handleRetryLocation,
  } = useCreateMemory();

  useCompanionThread("creatememory");
  const companionSnapshot: CompanionPageSnapshot = {
    summary: memoryState.summary,
    isSaving,
  };
  useCompanionPageSnapshot("creatememory", companionSnapshot);

  const headerTitle = format(
    new Date(memoryState.dateTimeOfCapture),
    "h:mm a",
  ).toLowerCase();

  const actionIcons = (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerSaveButton, isSaving && styles.buttonDisabled]}
      testID="create-memory-save-button"
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <MaterialIcons name="save" size={28} color="#007AFF" />
      )}
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
        <Text style={styles.screenHeading}>What&apos;s Happening</Text>
        <MemoryForm
          storage={memoryState}
          onStorageChange={setMemoryState}
          onRetryLocation={handleRetryLocation}
          timeMemoryId={null}
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
