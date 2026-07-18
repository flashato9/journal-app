import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

  const handleSeeMore = () => {
    const destination: Parameters<typeof router.push>[0] = {
      pathname: "/(memories)/daymemories",
      params: { id: memory.id, day: memory.day },
    };
    router.push(destination);
  };

  const content = (
    <TouchableOpacity
      onPress={handleSeeMore}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Summary: </Text>
          <Text style={styles.bold}>{memory.summary}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Day: </Text>
          <Text style={styles.bold}>{memory.day}</Text>
        </View>

        <TouchableOpacity onPress={handleSeeMore}>
          <Text style={styles.seeMore}>See More ...</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
  },
  bold: {
    fontSize: 20,
    fontWeight: "normal",
    color: "#000",
    flex: 1,
  },
  seeMore: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "500",
    marginTop: 4,
  },
});
