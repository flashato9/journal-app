import { MaterialIcons } from "@expo/vector-icons";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ImageCardProps {
  uri: string | number | ImageSourcePropType;
  onRemove?: () => void;
}

export default function ImageCard({ uri, onRemove }: ImageCardProps) {
  // Handle both string URIs and require() results
  const source = typeof uri === "string" ? { uri } : uri;

  return (
    <View style={styles.container}>
      <Image source={source} style={styles.image} resizeMode="cover" />
      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.6}
        >
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "31%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
