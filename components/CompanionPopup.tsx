import { useContext } from "react";
import { StyleSheet, Text } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "@/constants/colors";
import { CompanionContext } from "@/context/CompanionContext";

const colors = getColors();
const ICON_SIZE = 56;
const ICON_MARGIN = 16;
const POPUP_GAP = 12;
const POPUP_MAX_WIDTH = 220;

export default function CompanionPopup() {
  const { latestMessage, isChatOpen } = useContext(CompanionContext);
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

  if (!latestMessage || isChatOpen) {
    return null;
  }

  const positionStyle = {
    bottom: insets.bottom + ICON_MARGIN + ICON_SIZE + POPUP_GAP,
    right: insets.right + ICON_MARGIN,
  };
  const containerStyle = [
    styles.container,
    positionStyle,
    keyboardAnimatedStyle,
  ];

  const content = (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={containerStyle}>
      <Text style={styles.text}>{latestMessage.text}</Text>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    maxWidth: POPUP_MAX_WIDTH,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
});
