import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
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
  return (
    <SafeAreaView style={styles.container}>
      <Header title="All Memories" />

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
  listContent: {
    paddingVertical: 8,
  },
});
