import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getColors } from "@/constants/colors";

const colors = getColors();
const SUMMARY_HEIGHT = 64;
const SUMMARY_COUNTER_HEIGHT = 14;

interface SummaryCardProps {
  initialText: string;
  onSubmit: (text: string) => void;
}

export default function SummaryCard({
  initialText,
  onSubmit,
}: SummaryCardProps) {
  const [editedText, setEditedText] = useState<string>(initialText);
  const [isEditingMode, setIsEditingMode] = useState(false);

  useEffect(() => {
    setEditedText(initialText);
  }, [initialText]);

  const handleEdit = useCallback(() => {
    setIsEditingMode(true);
  }, []);

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
