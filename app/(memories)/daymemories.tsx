import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OptionsMenuContext } from "../context/OptionsMenuContext";
import TimeOfDayMemoryCard, {
    TimeOfDayMemory,
} from "./components/TimeOfDayMemoryCard";

// Mock API function
async function fetchMemoriesForDay(dayId: string): Promise<TimeOfDayMemory[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock data based on day ID
  const mockData: { [key: string]: TimeOfDayMemory[] } = {
    "1": [
      {
        id: "1",
        summary: "Morning coffee and meditation",
        timeOfRecord: "8:30 AM",
      },
      { id: "2", summary: "Lunch with colleagues", timeOfRecord: "12:00 PM" },
      { id: "3", summary: "Afternoon workout", timeOfRecord: "5:00 PM" },
      {
        id: "4",
        summary: "Evening dinner with family",
        timeOfRecord: "7:30 PM",
      },
    ],
    "2": [
      {
        id: "5",
        summary: "Early morning run",
        timeOfRecord: "6:00 AM",
      },
      { id: "6", summary: "Breakfast with mom", timeOfRecord: "9:00 AM" },
      { id: "7", summary: "Work meeting", timeOfRecord: "2:00 PM" },
    ],
    "3": [
      {
        id: "8",
        summary: "Yoga class",
        timeOfRecord: "7:00 AM",
      },
      { id: "9", summary: "Movie night", timeOfRecord: "8:00 PM" },
    ],
    "4": [
      {
        id: "10",
        summary: "Mountain hiking trip",
        timeOfRecord: "9:00 AM",
      },
      { id: "11", summary: "Sunset view", timeOfRecord: "6:30 PM" },
      { id: "12", summary: "Dinner at restaurant", timeOfRecord: "8:00 PM" },
    ],
  };

  return mockData[dayId] || [];
}

export default function DayMemoriesScreen() {
  const { id, day } = useLocalSearchParams();
  const router = useRouter();
  const { setMenuVisible } = useContext(OptionsMenuContext);
  const [memories, setMemories] = useState<TimeOfDayMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemories = async () => {
      setLoading(true);
      if (id) {
        const data = await fetchMemoriesForDay(id as string);
        setMemories(data);
      }
      setLoading(false);
    };

    loadMemories();
  }, [id]);

  const handleOptions = () => {
    setMenuVisible(true);
  };

  const handleCreateMemory = () => {
    router.push("/(memories)/creatememory");
  };

  const handleCreateMemoryLongPress = () => {
    ToastAndroid.show("Insert new memory", ToastAndroid.SHORT);
  };

  const headerTitle = day ? `${day} Memories` : "Today's Memories";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {headerTitle}
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={handleCreateMemory}
            onLongPress={handleCreateMemoryLongPress}
            delayLongPress={500}
          >
            <MaterialIcons name="add" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOptions} style={styles.settingsIcon}>
            <MaterialIcons name="settings" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexShrink: 0,
  },
  settingsIcon: {
    marginLeft: 4,
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
