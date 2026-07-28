import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useShake } from "@/hooks/ui/useShake";

const POLAROID_CORNER_RADIUS = 14;

interface PolaroidFrameProps {
  children: React.ReactNode;
  caption?: string | null;
  placeholder?: string;
  isTilted?: boolean;
  size?: number;
  onPress?: () => void;
}

export default function PolaroidFrame({
  children,
  caption,
  placeholder,
  isTilted = true,
  size = 160,
  onPress,
}: PolaroidFrameProps) {
  const { shake, shakeStyle } = useShake("rotate");

  const handlePress = () => {
    shake();
    onPress?.();
  };

  const frameStyle = [styles.frame, isTilted && styles.frameTilted];
  const photoAreaStyle = [styles.photoArea, { width: size, height: size }];
  const displayedCaption = caption || placeholder;
  const isPlaceholder = !caption && !!placeholder;

  const frame = (
    <View style={frameStyle}>
      <View style={photoAreaStyle}>{children}</View>
      {displayedCaption ? (
        <Text
          style={[styles.caption, isPlaceholder && styles.captionPlaceholder]}
        >
          {displayedCaption}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return frame;
  }

  const content = (
    <Animated.View style={shakeStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {frame}
      </TouchableOpacity>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: "#fff",
    borderRadius: POLAROID_CORNER_RADIUS,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    boxShadow:
      "-6px 0px 12px rgba(0, 0, 0, 0.25), 6px 0px 12px rgba(0, 0, 0, 0.25), 0px 8px 14px rgba(0, 0, 0, 0.3)",
  },
  frameTilted: {
    transform: [{ rotate: "-2deg" }],
  },
  photoArea: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: POLAROID_CORNER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  caption: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 12,
  },
  captionPlaceholder: {
    color: "#999",
    fontWeight: "400",
  },
});
