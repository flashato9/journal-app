import { StyleSheet, Text } from "react-native";
import { CompanionMood } from "@/services/companionApi";

export type CompanionExpressionState = CompanionMood | "sleeping" | "offline";

const EXPRESSION_EMOJI: Record<CompanionExpressionState, string> = {
  sleeping: "😴",
  offline: "🌴",
  neutral: "🙂",
  positive: "😁",
  sad: "😢",
  snarky: "😏",
};

interface CompanionFaceProps {
  expression: CompanionExpressionState;
}

export default function CompanionFace({ expression }: CompanionFaceProps) {
  const emoji = EXPRESSION_EMOJI[expression];
  const content = <Text style={styles.emoji}>{emoji}</Text>;
  return content;
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 28,
  },
});
