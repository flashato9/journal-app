import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { getColors } from "@/constants/colors";
import { useAIDaySummary } from "@/hooks/memories/useAIDaySummary";
import { useSpin } from "@/hooks/ui/useSpin";

const colors = getColors();
const SUMMARY_HEIGHT = 64;
const SUMMARY_COUNTER_HEIGHT = 14;

interface SummaryCardProps {
  initialText: string;
  onSubmit: (text: string) => void;
  dayMemoryId: number | null;
}

export default function SummaryCard({
  initialText,
  onSubmit,
  dayMemoryId,
}: SummaryCardProps) {
  const [editedText, setEditedText] = useState<string>(initialText);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const { isGenerating, generateSummary } = useAIDaySummary();
  const { spinStyle } = useSpin(isGenerating);

  useEffect(() => {
    setEditedText(initialText);
  }, [initialText]);

  const handleEdit = useCallback(() => {
    setIsEditingMode(true);
  }, []);

  // Generates a draft summary and drops it into the textbox for review; never auto-saves.
  const performGenerate = useCallback(async () => {
    if (dayMemoryId === null) return;
    const generatedSummary = await generateSummary(dayMemoryId, initialText);
    if (generatedSummary !== null) {
      setEditedText(generatedSummary);
    }
  }, [dayMemoryId, initialText, generateSummary]);

  // Confirms before discarding an unsaved manual edit, then runs performGenerate.
  const handleGenerate = useCallback(() => {
    if (editedText !== initialText) {
      Alert.alert(
        "Replace Unsaved Edit?",
        "Generating a new AI summary will replace the text you've typed. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Generate", onPress: performGenerate },
        ],
      );
      return;
    }
    performGenerate();
  }, [editedText, initialText, performGenerate]);

  // Validates the summary length, then calls onSubmit and exits edit mode.
  const handleSave = useCallback(() => {
    if (editedText.trim().length < 10) {
      Alert.alert("Error", "Summary must be at least 10 characters long");
      return;
    }

    if (editedText.length > 100) {
      Alert.alert("Error", "Summary must not exceed 100 characters");
      return;
    }

    onSubmit(editedText);
    setIsEditingMode(false);
  }, [editedText, onSubmit]);

  const content = (
    <View style={styles.summaryContainer}>
      {isEditingMode ? (
        <TextInput
          style={styles.summaryInput}
          value={editedText}
          onChangeText={setEditedText}
          multiline
          maxLength={100}
          placeholder="Enter summary (10-100 characters)"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
      ) : (
        <Text style={styles.summaryText} numberOfLines={2}>
          {initialText || "No summary provided"}
        </Text>
      )}
      {/* {isEditingMode && (
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isGenerating}
          style={styles.aiButton}
        >
          {isGenerating ? (
            <Animated.View style={spinStyle}>
              <MaterialCommunityIcons
                name="loading"
                size={24}
                color={colors.dayMemoriesDateChipBackground}
              />
            </Animated.View>
          ) : (
            <MaterialCommunityIcons
              name="robot-excited-outline"
              size={24}
              color={colors.dayMemoriesDateChipBackground}
            />
          )}
        </TouchableOpacity>
      )} */}
      <TouchableOpacity
        onPress={isEditingMode ? handleSave : handleEdit}
        style={styles.summaryButton}
      >
        <MaterialIcons
          name={isEditingMode ? "save" : "edit"}
          size={27}
          color={colors.dayMemoriesDateChipBackground}
        />
      </TouchableOpacity>
      {isEditingMode && (
        <Text style={styles.charCountText}>{editedText.length}/100</Text>
      )}
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  summaryContainer: {
    height: SUMMARY_HEIGHT,
    overflow: "hidden",
  },
  summaryText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 36,
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
  },
  summaryInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 36,
    bottom: SUMMARY_COUNTER_HEIGHT,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: "top",
  },
  aiButton: {
    position: "absolute",
    top: 0,
    right: 36,
    padding: 2,
  },
  summaryButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 2,
  },
  charCountText: {
    position: "absolute",
    bottom: 0,
    left: 0,
    fontSize: 11,
    color: colors.textMuted,
  },
});
