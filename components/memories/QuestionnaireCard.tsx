import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getColors } from "@/constants/colors";

const colors = getColors();

export interface QuestionnaireItem {
  id: string;
  question: string;
  answer: string;
}

interface QuestionnaireCardProps {
  item: QuestionnaireItem;
  index: number;
  onChange: (id: string, answer: string) => void;
  onQuestionChange?: (id: string, question: string) => void;
  onRemove?: () => void;
  isEditable?: boolean;
}

export default function QuestionnaireCard({
  item,
  index,
  onChange,
  onQuestionChange,
  onRemove,
  isEditable = true,
}: QuestionnaireCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isAnswerFocused, setIsAnswerFocused] = useState(false);

  const content = (
    <BlurView intensity={40} tint="light" style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.questionLabel}>Question {index}</Text>
        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            activeOpacity={0.6}
          >
            <MaterialIcons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
      {isEditable && isFocused ? (
        <TextInput
          style={styles.questionInput}
          value={item.question}
          onChangeText={(text) => onQuestionChange?.(item.id, text)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          numberOfLines={1}
          maxLength={100}
          placeholderTextColor={colors.createMemorySubtitleColor}
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
          placeholderTextColor={colors.createMemorySubtitleColor}
          scrollEnabled={true}
        />
      )}
      <TextInput
        style={[
          styles.input,
          !isEditable && styles.inputReadOnly,
          isAnswerFocused && styles.inputFocused,
        ]}
        placeholder="Your answer..."
        value={item.answer}
        onChangeText={(text) => onChange(item.id, text)}
        onFocus={() => setIsAnswerFocused(true)}
        onBlur={() => setIsAnswerFocused(false)}
        editable={isEditable}
        multiline
        numberOfLines={3}
        maxLength={300}
        placeholderTextColor={colors.createMemorySubtitleColor}
      />
    </BlurView>
  );
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.createMemoryCardBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.createMemoryCardBorder,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.createMemorySubtitleColor,
    textTransform: "uppercase",
  },
  removeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 11,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.createMemoryTitleColor,
    marginBottom: 8,
    borderWidth: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  questionInput: {
    borderWidth: 1,
    borderColor: colors.createMemoryAccentColor,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.createMemoryTitleColor,
    marginBottom: 8,
    backgroundColor: colors.createMemoryInputBackground,
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.25)",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.createMemoryCardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
    backgroundColor: colors.createMemoryInputBackground,
  },
  inputReadOnly: {
    borderColor: colors.createMemoryCardBorder,
    backgroundColor: colors.createMemoryCardBackground,
    color: colors.createMemorySubtitleColor,
  },
  inputFocused: {
    boxShadow: "0px 0px 6px rgba(143, 174, 125, 0.5)",
  },
});
