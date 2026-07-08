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

  // Update editedText when initialText changes
  useEffect(() => {
    setEditedText(initialText);
  }, [initialText]);

  const handleEdit = useCallback(() => {
    setIsEditingMode(true);
  }, []);

  const handleSave = useCallback(() => {
    // Validate length
    if (editedText.trim().length < 10) {
      Alert.alert("Error", "Summary must be at least 10 characters long");
      return;
    }

    if (editedText.length > 100) {
      Alert.alert("Error", "Summary must not exceed 100 characters");
      return;
    }

    // Call the onSubmit callback
    onSubmit(editedText);
    setIsEditingMode(false);
  }, [editedText, onSubmit]);

  return (
    <View style={styles.summaryContainer}>
      {isEditingMode ? (
        <View style={styles.editSummaryContainer}>
          <TextInput
            style={styles.summaryInput}
            value={editedText}
            onChangeText={setEditedText}
            multiline
            maxLength={100}
            placeholder="Enter summary (10-100 characters)"
            placeholderTextColor="#999"
            autoFocus
          />
          <Text style={styles.charCountText}>{editedText.length}/100</Text>
        </View>
      ) : (
        <Text style={styles.summaryText}>
          {initialText || "No summary provided"}
        </Text>
      )}
      <TouchableOpacity
        onPress={isEditingMode ? handleSave : handleEdit}
        style={styles.summaryButton}
      >
        <MaterialIcons
          name={isEditingMode ? "save" : "edit"}
          size={20}
          color="#007AFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  editSummaryContainer: {
    flex: 1,
    gap: 4,
  },
  summaryInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: "#333",
    minHeight: 60,
    textAlignVertical: "top",
  },
  charCountText: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
  summaryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
