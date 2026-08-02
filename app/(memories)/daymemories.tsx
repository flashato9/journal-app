import { format } from "date-fns/format";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, ToastAndroid, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import DayMemoriesHeader from "@/components/memories/DayMemoriesHeader";
import TimeOfDayMemoryCard from "@/components/memories/TimeOfDayMemoryCard";
import { getColors } from "@/constants/colors";
import { useDayMemories } from "@/hooks/memories/useDayMemories";

const colors = getColors();

function getDayParam(day: string | string[] | undefined): string {
  if (typeof day === "string") {
    return day;
  }
  const today = new Date().toISOString().split("T")[0];
  return today;
}

function isDayInPast(day: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  const isPast = day < today;
  return isPast;
}

export default function DayMemoriesScreen() {
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const { memories, isLoading, daySummary, dayMemoryId, handleSaveSummary } =
    useDayMemories();

  const handleCreateMemory = () => {
    router.push("/(memories)/creatememory");
  };

  const handleCreateMemoryLongPress = () => {
    ToastAndroid.show("Insert new memory", ToastAndroid.SHORT);
  };

  const dayParam = getDayParam(day);
  const isDayPast = isDayInPast(dayParam);

  const content = (
    <SafeAreaView style={styles.container}>
      <DayMemoriesHeader
        day={dayParam}
        daySummary={daySummary}
        dayMemoryId={dayMemoryId}
        onSaveSummary={handleSaveSummary}
        onCreateMemory={handleCreateMemory}
        onCreateMemoryLongPress={handleCreateMemoryLongPress}
        isCreateMemoryAllowed={!isDayPast}
      />
      <FlatList
        data={memories}
        renderItem={({ item }) => <TimeOfDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              {!isDayPast && (
                <Text style={styles.emptyTitle}>A blank page awaits...</Text>
              )}
              <Text style={styles.emptySubtitle}>
                {isDayPast
                  ? "No memories were recorded for this day."
                  : "Capture your thoughts for today."}
              </Text>
              {!isDayPast && (
                <View style={styles.createFirstButtonWrapper}>
                  <Button
                    text="Create First Memory"
                    onPress={handleCreateMemory}
                    iconName="plus-square-o"
                    isShiny
                    backgroundColor={colors.dayMemoriesDateChipBackground}
                    style={styles.createFirstButton}
                    textStyle={styles.createFirstButtonText}
                  />
                </View>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  createFirstButtonWrapper: {
    width: "100%",
    marginTop: 74,
  },
  createFirstButton: {
    borderRadius: 999,
    paddingHorizontal: 30,
    paddingVertical: 18,
    marginTop: 0,
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)",
  },
  createFirstButtonText: {
    fontSize: 25,
    fontWeight: "700",
  },
});
