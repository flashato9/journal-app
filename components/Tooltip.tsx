import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { logInfo } from "@/services/appLogger";

const TOOLTIP_GAP = 12;
const TOOLTIP_AUTO_DISMISS_MS = 5000;
const BUBBLE_HORIZONTAL_PADDING = 10;
const BUBBLE_VERTICAL_PADDING = 6;
const MEASUREMENT_WIDTH = 300;
const ARROW_SIZE = 6;
const WIDTH_SAFETY_BUFFER = 4;

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
  const [textWidth, setTextWidth] = useState<number | null>(null);

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
    logInfo("Tooltip text:", text);
  };

  const handleTriggerPress = () => {
    triggerRef.current?.measure(handleTriggerMeasured);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleTextMeasured = (event: LayoutChangeEvent) => {
    setTextWidth(event.nativeEvent.layout.width);
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
  const bubbleWidthStyle = textWidth
    ? { width: textWidth + BUBBLE_HORIZONTAL_PADDING * 2 + WIDTH_SAFETY_BUFFER }
    : undefined;
  const bubbleStyle = [styles.bubble, bubblePositionStyle, bubbleWidthStyle];
  const arrowPositionStyle = triggerLayout
    ? { right: triggerLayout.width / 2 - ARROW_SIZE }
    : undefined;
  const arrowStyle = [styles.arrow, arrowPositionStyle];

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
          <View
            style={styles.measurementContainer}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.text} onLayout={handleTextMeasured}>
              {text}
            </Text>
          </View>
          <Pressable style={bubbleStyle}>
            <View style={arrowStyle} />
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
    paddingHorizontal: BUBBLE_HORIZONTAL_PADDING,
    paddingVertical: BUBBLE_VERTICAL_PADDING,
    borderRadius: 6,
  },
  arrow: {
    position: "absolute",
    top: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 13,
  },
  measurementContainer: {
    position: "absolute",
    alignItems: "flex-start",
    opacity: 0,
    left: -9999,
    width: MEASUREMENT_WIDTH,
  },
});
