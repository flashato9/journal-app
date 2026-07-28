import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { getColors } from "@/constants/colors";

const colors = getColors();

const ARROW_LEFT_OFFSET_PX = 32;
const ARROW_SLIDE_DURATION_MS = 400;
const arrowSlideTimingConfig = {
  duration: ARROW_SLIDE_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};

export interface DailyMemorySummary {
  id: string;
  summary: string;
  day: string;
}

interface FullDayMemoryCardProps {
  memory: DailyMemorySummary;
}

export default function FullDayMemoryCard({ memory }: FullDayMemoryCardProps) {
  const router = useRouter();
  const arrowOffset = useSharedValue(-ARROW_LEFT_OFFSET_PX);
  const isNavigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      arrowOffset.value = -ARROW_LEFT_OFFSET_PX;
    }, [arrowOffset]),
  );

  const navigateToDayMemories = () => {
    const destination: Parameters<typeof router.push>[0] = {
      pathname: "/(memories)/daymemories",
      params: { id: memory.id, day: memory.day },
    };
    router.push(destination);
  };

  const handleSlideComplete = (finished?: boolean) => {
    isNavigatingRef.current = false;
    if (finished) {
      navigateToDayMemories();
    }
  };

  const handleSeeMore = () => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;
    arrowOffset.value = withTiming(0, arrowSlideTimingConfig, (finished) => {
      runOnJS(handleSlideComplete)(finished);
    });
  };

  const arrowStyle = useAnimatedStyle(() => {
    const animatedStyle = { transform: [{ translateX: arrowOffset.value }] };
    return animatedStyle;
  });

  const parsedDay = parse(memory.day, "yyyy-MM-dd", new Date());
  const dayNumber = format(parsedDay, "d");
  const monthAbbreviation = format(parsedDay, "MMM");

  const content = (
    <TouchableOpacity
      onPress={handleSeeMore}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.dateBadge}>
        <Text style={styles.dayNumber}>{dayNumber}</Text>
        <View style={styles.dateDivider} />
        <Text style={styles.monthAbbreviation}>{monthAbbreviation}</Text>
      </View>

      <Text style={styles.summary}>{memory.summary}</Text>

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
    marginHorizontal: 4,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dateBadge: {
    alignItems: "center",
    backgroundColor: colors.dayCardBadgeBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 64,
  },
  dayNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  dateDivider: {
    width: "80%",
    height: 1,
    backgroundColor: colors.dayCardDivider,
    marginVertical: 4,
  },
  monthAbbreviation: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  summary: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  seeMoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dayCardAccent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
