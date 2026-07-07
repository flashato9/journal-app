import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDayMemoryById,
  getTimeMemoriesByDayMemoryId,
  updateDayMemory,
} from "../../services/database";
import Header from "../components/Header";
import SummaryCard from "./components/SummaryCard";
import TimeOfDayMemoryCard, {
  TimeOfDayMemory,
} from "./components/TimeOfDayMemoryCard";

export default function DayMemoriesScreen() {
  const { id, day } = useLocalSearchParams();
  const router = useRouter();
  const [memories, setMemories] = useState<TimeOfDayMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayMemoryId, setDayMemoryId] = useState<number | null>(null);
  const [daySummary, setDaySummary] = useState<string>("");

  // Fetch time memories when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error("Day memory ID is missing");
        }

        const dayMemoryId = parseInt(id as string, 10);
        setDayMemoryId(dayMemoryId);

        // Fetch day memory to get summary
        const dayMemory = getDayMemoryById(dayMemoryId);
        if (dayMemory) {
          setDaySummary(dayMemory.summary || "");
        }

        const timeMemories = getTimeMemoriesByDayMemoryId(dayMemoryId);

        const memorySummaries = timeMemories.map((tm) => ({
          id: tm.id.toString(),
          summary: tm.summary,
          timeOfRecord: tm.timeOfRecord,
        }));

        console.log("Fetched time memories:", memorySummaries);
        setMemories(memorySummaries);
      } catch (error) {
        console.error("Error fetching time memories:", error);
        setMemories([]);
      } finally {
        setLoading(false);
      }
    }, [id]),
  );

  const handleCreateMemory = () => {
    router.push("/(memories)/creatememory");
  };

  const handleCreateMemoryLongPress = () => {
    ToastAndroid.show("Insert new memory", ToastAndroid.SHORT);
  };

  const handleSaveSummary = (newSummary: string) => {
    try {
      if (!dayMemoryId) {
        throw new Error("Day memory ID not found");
      }

      // Update in database
      updateDayMemory(dayMemoryId, newSummary);
      setDaySummary(newSummary);
      Alert.alert("Success", "Summary updated successfully");
    } catch (error) {
      console.error("Error saving summary:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save summary",
      );
    }
  };

  const headerTitle = day ? `${day} Memories` : "Today's Memories";

  const actionIcons = (
    <TouchableOpacity
      onPress={handleCreateMemory}
      onLongPress={handleCreateMemoryLongPress}
      delayLongPress={500}
    >
      <MaterialIcons name="add" size={28} color="#000" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} actionIcons={actionIcons} />

      {/* Summary Section */}
      <SummaryCard initialText={daySummary} onSubmit={handleSaveSummary} />

      {/* Memories List */}
      <FlatList
        data={memories}
        renderItem={({ item }) => <TimeOfDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No memories for this day</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
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
