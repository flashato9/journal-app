import { useContext } from "react";
import {
    BackHandler,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { OptionsMenuContext } from "../context/OptionsMenuContext";

export default function OptionsMenu() {
  const { menuVisible, setMenuVisible } = useContext(OptionsMenuContext);

  const handleExitApp = () => {
    setMenuVisible(false);
    BackHandler.exitApp();
  };

  const menuOptions = [{ label: "Exit App", onPress: handleExitApp }];

  return (
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        {/* Menu */}
        <View style={styles.menu}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuOptions.length - 1 && styles.lastItem,
              ]}
              onPress={option.onPress}
            >
              <Text style={styles.menuText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  menu: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: "#000",
  },
});
