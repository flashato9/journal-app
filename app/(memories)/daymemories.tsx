import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import SummaryCard from "@/components/memories/SummaryCard";
import TimeOfDayMemoryCard from "@/components/memories/TimeOfDayMemoryCard";
import { useDayMemories } from "@/hooks/memories/useDayMemories";

// Formats the raw yyyy-MM-dd day param into a display title, e.g. "July 24th, 2026 Memories".
function formatDayTitle(day: string | string[] | undefined): string {
  if (typeof day !== "string") {
    return "Today's Memories";
  }
  try {
    const parsedDay = parse(day, "yyyy-MM-dd", new Date());
    const formattedTitle = `${format(parsedDay, "MMMM do, yyyy")} Memories`;
    return formattedTitle;
  } catch {
    return "Today's Memories";
  }
}

export default function DayMemoriesScreen() {
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const { memories, isLoading, daySummary, handleSaveSummary } =
    useDayMemories();

  const handleCreateMemory = () => {
    router.push("/(memories)/creatememory");
  };

  const handleCreateMemoryLongPress = () => {
    ToastAndroid.show("Insert new memory", ToastAndroid.SHORT);
  };

  const headerTitle = formatDayTitle(day);

  const actionIcons = (
    <TouchableOpacity
      onPress={handleCreateMemory}
      onLongPress={handleCreateMemoryLongPress}
      delayLongPress={500}
    >
      <MaterialIcons name="add" size={28} color="#000" />
    </TouchableOpacity>
  );

  const content = (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title={headerTitle} actionIcons={actionIcons} />
      <SummaryCard initialText={daySummary} onSubmit={handleSaveSummary} />
      <FlatList
        data={memories}
        renderItem={({ item }) => <TimeOfDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No memories for this day</Text>
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
    backgroundColor: "#fff",
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
