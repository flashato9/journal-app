import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tooltip from "@/components/Tooltip";
import { getColors } from "@/constants/colors";
import { AuthContext } from "@/context/AuthContext";
import { OptionsMenuContext } from "@/context/OptionsMenuContext";
import { useRefreshLocationTrackingOnFocus } from "@/hooks/options/useRefreshLocationTrackingOnFocus";
import { useUserSession } from "@/hooks/welcome/useUserSession";

const colors = getColors();

const HEADER_CONTENT_PADDING = 8;

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
  const insets = useSafeAreaInsets();

  useRefreshLocationTrackingOnFocus(refreshLocationTrackingStatus);

  const handleOptions = () => {
    setMenuVisible(true);
  };

  const handleProfilePress = () => {
    router.push("/profile-settings");
  };

  const locationTooltipText = locationTrackingActive
    ? "Location Tracking: Online"
    : "Location Tracking: Offline";
  const locationIconName = locationTrackingActive
    ? "map-marker-outline"
    : "map-marker-off-outline";
  const headerPaddingTop = insets.top + HEADER_CONTENT_PADDING;
  const dynamicHeaderStyle = { paddingTop: headerPaddingTop };

  const content = (
    <View style={[styles.header, dynamicHeaderStyle, containerStyle]}>
      <View style={styles.titleSlot}>
        {title && (
          <View style={styles.titlePill}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>
      {actionIcons && (
        <View style={styles.actionIconsWrapper}>{actionIcons}</View>
      )}
      <View style={styles.rightIconsWrapper}>
        <Tooltip text={locationTooltipText}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={locationIconName}
              size={22}
              color={colors.headerIconColor}
              style={styles.iconGlyphShadow}
            />
          </View>
        </Tooltip>
        {username && !hideProfileIcon && (
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconCircle}
          >
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
        <TouchableOpacity onPress={handleOptions} style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={colors.headerIconColor}
            style={styles.iconGlyphShadow}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.headerBackground,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingBottom: HEADER_CONTENT_PADDING,
    gap: 16,
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)",
  },
  titleSlot: {
    flexShrink: 1,
  },
  titlePill: {
    backgroundColor: colors.headerChipBackground,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.headerChipBackground,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  iconGlyphShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  profileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  profileIconPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
