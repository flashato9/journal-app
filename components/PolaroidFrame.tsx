import { StyleSheet, Text, View } from "react-native";

interface PolaroidFrameProps {
  children: React.ReactNode;
  caption?: string | null;
}

export default function PolaroidFrame({
  children,
  caption,
}: PolaroidFrameProps) {
  const content = (
    <View style={styles.frame}>
      <View style={styles.photoArea}>{children}</View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
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
    transform: [{ rotate: "-2deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  photoArea: {
    width: 160,
    height: 160,
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
});
