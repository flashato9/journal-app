import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export interface QuestionnaireItem {
  id: string;
  question: string;
  answer: string;
}

interface QuestionnaireCardProps {
  item: QuestionnaireItem;
  onChange: (id: string, answer: string) => void;
  onQuestionChange?: (id: string, question: string) => void;
  onRemove?: () => void;
  isEditable?: boolean;
}

export default function QuestionnaireCard({
  item,
  onChange,
  onQuestionChange,
  onRemove,
  isEditable = true,
}: QuestionnaireCardProps) {
  const [isFocused, setIsFocused] = useState(false);

  const content = (
    <View style={styles.card}>
      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.6}
        >
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      )}
      {isEditable && isFocused ? (
        <TextInput
          style={styles.questionInput}
          value={item.question}
          onChangeText={(text) => onQuestionChange?.(item.id, text)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          numberOfLines={1}
          maxLength={100}
          placeholderTextColor="#999"
          autoFocus
          scrollEnabled={true}
        />
      ) : (
        <TextInput
          style={styles.questionText}
          value={item.question}
          onChangeText={(text) => onQuestionChange?.(item.id, text)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={isEditable}
          numberOfLines={1}
          maxLength={100}
          placeholderTextColor="#999"
          scrollEnabled={true}
        />
      )}
      <TextInput
        style={[styles.input, !isEditable && styles.inputReadOnly]}
        placeholder="Your answer..."
        value={item.answer}
        onChangeText={(text) => onChange(item.id, text)}
        editable={isEditable}
        multiline
        numberOfLines={3}
        maxLength={300}
        placeholderTextColor="#999"
      />
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    borderWidth: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  questionInput: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#000",
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  inputReadOnly: {
    borderColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
});
