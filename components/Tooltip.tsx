import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TOOLTIP_GAP = 8;
const TOOLTIP_AUTO_DISMISS_MS = 5000;

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

// Wraps any element so tapping it shows a dismissible tooltip bubble below it.
export default function Tooltip({ text, children }: TooltipProps) {
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  const handleTriggerMeasured = (
    x: number,
    y: number,
    width: number,
    height: number,
    pageX: number,
    pageY: number,
  ) => {
    const layout = { x: pageX, y: pageY, width, height };
    setTriggerLayout(layout);
    setIsVisible(true);
  };

  const handleTriggerPress = () => {
    triggerRef.current?.measure(handleTriggerMeasured);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, TOOLTIP_AUTO_DISMISS_MS);
    const cancelTimer = () => clearTimeout(timer);
    return cancelTimer;
  }, [isVisible]);

  const windowWidth = Dimensions.get("window").width;
  const bubblePositionStyle = triggerLayout
    ? {
        top: triggerLayout.y + triggerLayout.height + TOOLTIP_GAP,
        right: windowWidth - (triggerLayout.x + triggerLayout.width),
      }
    : undefined;
  const bubbleStyle = [styles.bubble, bubblePositionStyle];

  const content = (
    <>
      <View ref={triggerRef}>
        <TouchableOpacity onPress={handleTriggerPress}>
          {children}
        </TouchableOpacity>
      </View>
      <Modal
        transparent
        statusBarTranslucent
        visible={isVisible}
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={bubbleStyle}>
            <View style={styles.arrow} />
            <Text style={styles.text}>{text}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
  return content;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  bubble: {
    position: "absolute",
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  arrow: {
    position: "absolute",
    top: -6,
    right: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 13,
  },
});
