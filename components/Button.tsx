import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from "react-native";

interface ButtonProps {
  onPress: () => void | Promise<void>;
  text: string;
  textStyle?: TextStyle;
  backgroundColor?: string;
  disabled?: boolean;
}

// Awaits onPress and shows a spinner while it resolves, guarding against double-taps.
export default function Button({
  onPress,
  text,
  textStyle,
  backgroundColor,
  disabled,
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

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

  const backgroundColorStyle = backgroundColor ? { backgroundColor } : null;

  const content = (
    <TouchableOpacity
      style={[
        styles.button,
        backgroundColorStyle,
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
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
