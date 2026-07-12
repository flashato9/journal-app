import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useContext } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { OptionsMenuContext } from "@/context/OptionsMenuContext";
import { useUserSession } from "@/hooks/welcome/useUserSession";

interface HeaderProps {
  title: string;
  actionIcons?: React.ReactNode;
  containerStyle?: ViewStyle;
  hideProfileIcon?: boolean;
}

export default function Header({
  title,
  actionIcons,
  containerStyle,
  hideProfileIcon = false,
}: HeaderProps) {
  const {
    setMenuVisible,
    locationTrackingActive,
    refreshLocationTrackingStatus,
  } = useContext(OptionsMenuContext);
  const { username } = useContext(AuthContext);
  const { profileImagePath } = useUserSession();
  const router = useRouter();

  // Refresh immediately on screen focus, instead of waiting for the next
  // periodic poll in OptionsMenuContext.
  useFocusEffect(
    useCallback(() => {
      refreshLocationTrackingStatus();
    }, [refreshLocationTrackingStatus]),
  );

  const handleOptions = () => {
    setMenuVisible(true);
  };

  const handleProfilePress = () => {
    router.push("/profile-settings");
  };

  const handleLocationIconPress = () => {
    Alert.alert(
      "Location Tracking",
      locationTrackingActive ? "Online" : "Offline",
    );
  };

  return (
    <View style={[styles.header, containerStyle]}>
      <Text style={styles.headerTitle}>{title}</Text>
      {actionIcons && (
        <View style={styles.actionIconsWrapper}>{actionIcons}</View>
      )}
      <View style={styles.rightIconsWrapper}>
        <TouchableOpacity onPress={handleLocationIconPress}>
          <MaterialCommunityIcons
            name={locationTrackingActive ? "map-marker" : "map-marker-off"}
            size={22}
            color={locationTrackingActive ? "#4CAF50" : "#999"}
          />
        </TouchableOpacity>
        {username && !hideProfileIcon && (
          <TouchableOpacity onPress={handleProfilePress}>
            {profileImagePath ? (
              <Image
                source={{ uri: profileImagePath }}
                style={styles.profileIcon}
              />
            ) : (
              <View style={styles.profileIconPlaceholder} />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleOptions} style={styles.optionsIcon}>
          <MaterialIcons name="settings" size={28} color="#000" />
        </TouchableOpacity>
      </View>
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
  rightIconsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionsIcon: {},
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
