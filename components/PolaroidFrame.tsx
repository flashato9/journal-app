import { StyleSheet, Text, View } from "react-native";

interface PolaroidFrameProps {
  children: React.ReactNode;
  caption?: string | null;
  placeholder?: string;
  isTilted?: boolean;
  size?: number;
}

export default function PolaroidFrame({
  children,
  caption,
  placeholder,
  isTilted = true,
  size = 160,
}: PolaroidFrameProps) {
  const frameStyle = [styles.frame, isTilted && styles.frameTilted];
  const photoAreaStyle = [styles.photoArea, { width: size, height: size }];
  const displayedCaption = caption || placeholder;
  const isPlaceholder = !caption && !!placeholder;
  const content = (
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
  return content;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  frameTilted: {
    transform: [{ rotate: "-2deg" }],
  },
  photoArea: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
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
