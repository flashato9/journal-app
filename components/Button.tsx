import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from "react-native";

interface ButtonProps {
  // onPress may be async — the button awaits it and shows a spinner until it resolves
  onPress: () => void | Promise<void>;
  text: string;
  textStyle?: TextStyle;
  backgroundColor?: string;
  disabled?: boolean;
}

export default function Button({
  onPress,
  text,
  textStyle,
  backgroundColor,
  disabled,
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Disabled if the caller says so, or while the async onPress is running
  const isDisabled = disabled || isLoading;

  const handlePress = async () => {
    if (isLoading) return; // guard against double-taps while running
    try {
      setIsLoading(true);
      await onPress();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        backgroundColor ? { backgroundColor } : null,
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
