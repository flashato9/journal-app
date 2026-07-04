import { StyleSheet, Text, TextInput, View } from "react-native";

export interface QuestionnaireItem {
  id: string;
  question: string;
  answer: string;
}

interface QuestionnaireCardProps {
  item: QuestionnaireItem;
  onChange: (id: string, answer: string) => void;
  isEditable?: boolean;
}

export default function QuestionnaireCard({
  item,
  onChange,
  isEditable = true,
}: QuestionnaireCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>{item.question}</Text>
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
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
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
