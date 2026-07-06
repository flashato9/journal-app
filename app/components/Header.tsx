import { MaterialIcons } from "@expo/vector-icons";
import { useContext } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { OptionsMenuContext } from "../../context/OptionsMenuContext";

interface HeaderProps {
  title: string;
  actionIcons?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export default function Header({
  title,
  actionIcons,
  containerStyle,
}: HeaderProps) {
  const { setMenuVisible } = useContext(OptionsMenuContext);

  const handleOptions = () => {
    setMenuVisible(true);
  };

  return (
    <View
      style={[
        styles.header,
        containerStyle,
      ]}
    >
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
    paddingVertical: 16,
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
