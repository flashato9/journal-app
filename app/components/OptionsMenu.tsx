import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import {
    BackHandler,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { OptionsMenuContext } from "../../context/OptionsMenuContext";
import { isLocationTrackingActive } from "../../services/locationService";

export default function OptionsMenu() {
  const { menuVisible, setMenuVisible, locationTrackingActive } =
    useContext(OptionsMenuContext);

  const handleMenuShow = async () => {
    // Check location tracking status when menu becomes visible
    const isActive = await isLocationTrackingActive();
    console.log("Location tracking active:", isActive);
  };

  const handleExitApp = () => {
    setMenuVisible(false);
    BackHandler.exitApp();
  };

  const menuOptions = [
    {
      label: `Location Tracking: ${locationTrackingActive ? "Online" : "Offline"}`,
      onPress: () => {},
      disabled: true,
      isStatus: true,
    },
    { label: "Exit App", onPress: handleExitApp },
  ];

  return (
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
      onShow={handleMenuShow}
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
                option.isStatus && styles.statusItem,
              ]}
              onPress={option.onPress}
              disabled={option.disabled}
            >
              <View style={styles.menuItemContent}>
                {option.isStatus && (
                  <MaterialCommunityIcons
                    name={
                      locationTrackingActive ? "map-marker" : "map-marker-off"
                    }
                    size={16}
                    color={locationTrackingActive ? "#4CAF50" : "#999"}
                    style={styles.statusIcon}
                  />
                )}
                <Text
                  style={[
                    styles.menuText,
                    option.isStatus && {
                      color: locationTrackingActive ? "#4CAF50" : "#999",
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
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
  statusItem: {
    backgroundColor: "#f9f9f9",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: "#000",
  },
});
