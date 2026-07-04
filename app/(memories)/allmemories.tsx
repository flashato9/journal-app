import { MaterialIcons } from "@expo/vector-icons";
import { useContext } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OptionsMenuContext } from "../context/OptionsMenuContext";
import FullDayMemoryCard, {
    DailyMemorySummary,
} from "./components/FullDayMemoryCard";

const SAMPLE_MEMORIES: DailyMemorySummary[] = [
  { id: "1", summary: "A great day with friends", day: "July 1st 2026" },
  { id: "2", summary: "Productive work session", day: "June 30th 2026" },
  { id: "3", summary: "Relaxing evening at home", day: "June 29th 2026" },
  {
    id: "4",
    summary: "Wonderful trip to the mountains",
    day: "June 28th 2026",
  },
];

export default function AllMemoriesScreen() {
  const { setMenuVisible } = useContext(OptionsMenuContext);

  const handleOptions = () => {
    setMenuVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Memories</Text>
        <TouchableOpacity onPress={handleOptions}>
          <MaterialIcons name="settings" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Memories List */}
      <FlatList
        data={SAMPLE_MEMORIES}
        renderItem={({ item }) => <FullDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    justifyContent: "space-between",
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
  },
  listContent: {
    paddingVertical: 8,
  },
});
