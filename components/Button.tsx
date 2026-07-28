import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useShake } from "@/hooks/ui/useShake";

const FONT_SIZE = 16;

interface ButtonProps {
  onPress: () => void | Promise<void>;
  text: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
  backgroundColor?: string;
  disabled?: boolean;
  shakeTrigger?: number;
}

// Awaits onPress and shows a spinner while it resolves, guarding against double-taps.
export default function Button({
  onPress,
  text,
  textStyle,
  style,
  backgroundColor,
  disabled,
  shakeTrigger,
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { shake, shakeStyle } = useShake("horizontal");

  const isDisabled = disabled || isLoading;

  const handlePress = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      await onPress();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!shakeTrigger) {
      return;
    }
    shake();
  }, [shakeTrigger, shake]);

  const backgroundColorStyle = backgroundColor ? { backgroundColor } : null;

  const content = (
    <Animated.View style={shakeStyle}>
      <TouchableOpacity
        style={[
          styles.button,
          backgroundColorStyle,
          style,
          isDisabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.text, textStyle]}>{text}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  text: {
    color: "#fff",
    fontSize: FONT_SIZE,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
