import { useContext, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "@/constants/colors";
import { CompanionContext } from "@/context/CompanionContext";

const colors = getColors();
const ICON_SIZE = 56;
const ICON_MARGIN = 16;
const SLEEPING_OPACITY = 0.4;
const READY_OPACITY = 1;
const WAKE_TRANSITION_DURATION_MS = 800;
const SLEEPING_EMOJI = "😴";
const READY_EMOJI = "🙂";

export default function CompanionIcon() {
  const { status } = useContext(CompanionContext);
  const insets = useSafeAreaInsets();
  const isReady = status === "ready";
  const emoji = isReady ? READY_EMOJI : SLEEPING_EMOJI;
  const opacity = useSharedValue(SLEEPING_OPACITY);

  useEffect(() => {
    const targetOpacity = isReady ? READY_OPACITY : SLEEPING_OPACITY;
    opacity.value = withTiming(targetOpacity, {
      duration: WAKE_TRANSITION_DURATION_MS,
    });
  }, [isReady, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const style = { opacity: opacity.value };
    return style;
  });

  const positionStyle = {
    bottom: insets.bottom + ICON_MARGIN,
    right: insets.right + ICON_MARGIN,
  };
  const containerStyle = [styles.container, positionStyle, animatedStyle];

  const content = (
    <Animated.View style={containerStyle}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  emoji: {
    fontSize: 28,
  },
});
