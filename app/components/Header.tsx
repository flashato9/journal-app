import { MaterialIcons } from "@expo/vector-icons";
import { useContext } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OptionsMenuContext } from "../../context/OptionsMenuContext";

interface HeaderProps {
  title: string;
  actionIcons?: React.ReactNode;
  containerStyle?: ViewStyle;
  useSafeArea?: boolean;
}

export default function Header({
  title,
  actionIcons,
  containerStyle,
  useSafeArea,
}: HeaderProps) {
  const { setMenuVisible } = useContext(OptionsMenuContext);
  const insets = useSafeAreaInsets();

  const handleOptions = () => {
    setMenuVisible(true);
  };

  return (
    <View style={[styles.header, useSafeArea && { paddingTop: insets.top }, containerStyle]}>
      <Text style={styles.headerTitle}>{title}</Text>
      {actionIcons && (
        <View style={styles.actionIconsWrapper}>{actionIcons}</View>
      )}
      <TouchableOpacity onPress={handleOptions} style={styles.optionsIcon}>
        <MaterialIcons name="settings" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    display: "flex",
    flexShrink: 1,
  },
  actionIconsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionsIcon: {},
});
