import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { getColors } from "@/constants/colors";
import { useArrowSlideNavigate } from "@/hooks/memories/useArrowSlideNavigate";

const colors = getColors();

export interface TimeOfDayMemory {
  id: string;
  summary: string;
  timeOfRecord: string;
}

interface TimeOfDayMemoryCardProps {
  memory: TimeOfDayMemory;
  day?: string;
}

function formatTime(isoDatetime: string): string {
  try {
    const time = format(parseISO(isoDatetime), "h:mm");
    return time;
  } catch {
    const fallbackTime = "--:--";
    return fallbackTime;
  }
}

function formatMeridiem(isoDatetime: string): string {
  try {
    const meridiem = format(parseISO(isoDatetime), "aa");
    return meridiem;
  } catch {
    const fallbackMeridiem = "";
    return fallbackMeridiem;
  }
}

export default function TimeOfDayMemoryCard({
  memory,
  day = new Date().toISOString().split("T")[0],
}: TimeOfDayMemoryCardProps) {
  const router = useRouter();

  // Passes the raw ISO datetime to readoreditmemory, not the pre-formatted display string.
  const navigateToMemoryDetail = useCallback(() => {
    const destination: Parameters<typeof router.push>[0] = {
      pathname: "/readoreditmemory",
      params: {
        summary: memory.summary,
        timeOfRecord: memory.timeOfRecord,
        id: memory.id,
      },
    };
    router.push(destination);
  }, [router, memory.summary, memory.timeOfRecord, memory.id]);

  const { arrowStyle, handlePress } = useArrowSlideNavigate(
    navigateToMemoryDetail,
  );

  const content = (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{formatTime(memory.timeOfRecord)}</Text>
        <Text style={styles.meridiemText}>
          {formatMeridiem(memory.timeOfRecord)}
        </Text>
      </View>

      <Text style={styles.summary} numberOfLines={2}>
        {memory.summary}
      </Text>

      <Animated.View style={arrowStyle}>
        <View style={styles.seeMoreButton}>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={colors.dayCardAccentText}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
  return content;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.dayCardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  timeBadge: {
    alignItems: "center",
    backgroundColor: colors.dayCardBadgeBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 64,
  },
  timeText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  meridiemText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  summary: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  seeMoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dayCardAccent,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.25)",
  },
});
