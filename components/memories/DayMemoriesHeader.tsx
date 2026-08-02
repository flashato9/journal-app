import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { useRouter } from "expo-router";
import { useContext } from "react";
import {
  Alert,
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SummaryCard from "@/components/memories/SummaryCard";
import Tooltip from "@/components/Tooltip";
import { getColors } from "@/constants/colors";
import { AuthContext } from "@/context/AuthContext";
import { OptionsMenuContext } from "@/context/OptionsMenuContext";
import { useRefreshLocationTrackingOnFocus } from "@/hooks/options/useRefreshLocationTrackingOnFocus";
import { useUserSession } from "@/hooks/welcome/useUserSession";

const colors = getColors();

interface DateParts {
  month: string;
  dayNumber: string;
  year: string;
}

interface DayMemoriesHeaderProps {
  day: string;
  daySummary: string;
  dayMemoryId: number | null;
  onSaveSummary: (text: string) => void;
  onCreateMemory: () => void;
  onCreateMemoryLongPress: () => void;
  isCreateMemoryAllowed: boolean;
}

function formatDateParts(day: string): DateParts {
  try {
    const parsedDay = parse(day, "yyyy-MM-dd", new Date());
    const parts = {
      month: format(parsedDay, "MMM").toUpperCase(),
      dayNumber: format(parsedDay, "dd"),
      year: format(parsedDay, "yyyy"),
    };
    return parts;
  } catch {
    const fallbackParts = { month: "--", dayNumber: "--", year: "----" };
    return fallbackParts;
  }
}

// Floating card combining the date chip, editable summary, and grouped action chips for the Day Memories screen.
export default function DayMemoriesHeader({
  day,
  daySummary,
  dayMemoryId,
  onSaveSummary,
  onCreateMemory,
  onCreateMemoryLongPress,
  isCreateMemoryAllowed,
}: DayMemoriesHeaderProps) {
  const { locationTrackingActive, refreshLocationTrackingStatus } =
    useContext(OptionsMenuContext);
  const { username } = useContext(AuthContext);
  const { profileImagePath } = useUserSession();
  const router = useRouter();

  useRefreshLocationTrackingOnFocus(refreshLocationTrackingStatus);

  const handleExitApp = () => {
    Alert.alert("Exit app?", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        onPress: () => BackHandler.exitApp(),
        style: "destructive",
      },
    ]);
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

  const {
    month: monthAbbreviation,
    dayNumber,
    year: yearNumber,
  } = formatDateParts(day);

  const content = (
    <View style={styles.card}>
      <View style={styles.dateChip}>
        <Text style={styles.dateMonth}>{monthAbbreviation}</Text>
        <Text style={styles.dateDay}>{dayNumber}</Text>
        <Text style={styles.dateYear}>{yearNumber}</Text>
      </View>
      <View style={styles.rightColumn}>
        <SummaryCard
          initialText={daySummary}
          onSubmit={onSaveSummary}
          dayMemoryId={dayMemoryId}
        />
        <View style={styles.actionsRow}>
          {isCreateMemoryAllowed && (
            <TouchableOpacity
              onPress={onCreateMemory}
              onLongPress={onCreateMemoryLongPress}
              delayLongPress={500}
              style={styles.actionChip}
            >
              <FontAwesome
                name="plus-square-o"
                size={22}
                color={colors.dayMemoriesIconColor}
              />
            </TouchableOpacity>
          )}
          <Tooltip text={locationTooltipText}>
            <View style={styles.actionChip}>
              <MaterialCommunityIcons
                name={locationIconName}
                size={22}
                color={colors.dayMemoriesIconColor}
              />
            </View>
          </Tooltip>
          {username && (
            <TouchableOpacity
              onPress={handleProfilePress}
              style={styles.actionChip}
            >
              {profileImagePath ? (
                <Image
                  source={{ uri: profileImagePath }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleExitApp} style={styles.actionChip}>
            <MaterialCommunityIcons
              name="exit-to-app"
              size={22}
              color={colors.dayMemoriesIconColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dayMemoriesHeaderBackground,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.2)",
  },
  dateChip: {
    backgroundColor: colors.dayMemoriesDateChipBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 76,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  dateMonth: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dayMemoriesDateChipText,
  },
  dateDay: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.dayMemoriesDateChipText,
    lineHeight: 44,
  },
  dateYear: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.dayMemoriesDateChipText,
  },
  rightColumn: {
    flex: 1,
    justifyContent: "space-between",
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.dayMemoriesChipBackground,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profilePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: colors.border,
  },
});
