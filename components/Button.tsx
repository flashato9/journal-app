import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useShake } from "@/hooks/ui/useShake";
import { useShine } from "@/hooks/ui/useShine";

const FONT_SIZE = 16;
const ICON_SIZE = 31;
const SHINE_BAND_WIDTH = 60;
const SHINE_GRADIENT_COLORS = [
  "transparent",
  "rgba(255, 255, 255, 0.55)",
  "transparent",
] as const;
const SHINE_GRADIENT_START = { x: 0, y: 0 };
const SHINE_GRADIENT_END = { x: 1, y: 0 };

interface ButtonProps {
  onPress: () => void | Promise<void>;
  text: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
  backgroundColor?: string;
  disabled?: boolean;
  shakeTrigger?: number;
  iconName?: React.ComponentProps<typeof FontAwesome>["name"];
  isShiny?: boolean;
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
  iconName,
  isShiny,
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { shake, shakeStyle } = useShake("horizontal");
  const { shineStyle, handleShineLayout } = useShine(
    isShiny ?? false,
    SHINE_BAND_WIDTH,
  );

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
        <View style={styles.contentClip} onLayout={handleShineLayout}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : iconName ? (
            <View style={styles.contentRow}>
              <Text style={[styles.text, textStyle]}>{text}</Text>
              <FontAwesome name={iconName} size={ICON_SIZE} color="#fff" />
            </View>
          ) : (
            <Text style={[styles.text, textStyle]}>{text}</Text>
          )}
          {isShiny && (
            <Animated.View
              style={[styles.shineBand, shineStyle]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={SHINE_GRADIENT_COLORS}
                start={SHINE_GRADIENT_START}
                end={SHINE_GRADIENT_END}
                style={styles.shineGradientFill}
              />
            </Animated.View>
          )}
        </View>
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
  contentClip: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 999,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#fff",
    fontSize: FONT_SIZE,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  shineBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SHINE_BAND_WIDTH,
  },
  shineGradientFill: {
    flex: 1,
  },
});
