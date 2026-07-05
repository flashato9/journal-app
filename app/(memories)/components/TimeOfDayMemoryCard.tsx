import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface TimeOfDayMemory {
  id: string;
  summary: string;
  timeOfRecord: string;
}

interface TimeOfDayMemoryCardProps {
  memory: TimeOfDayMemory;
  day?: string;
}

// Helper function to format ISO datetime for display
function formatTimeOfRecord(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "h:mmaa");
  } catch (error) {
    return "Unknown time";
  }
}

export default function TimeOfDayMemoryCard({
  memory,
  day = new Date().toISOString().split("T")[0],
}: TimeOfDayMemoryCardProps) {
  const router = useRouter();

  const handleSeeMore = () => {
    // Pass raw ISO datetime to readmemory
    console.log("handleSeeMore - timeOfRecord (ISO):", memory.timeOfRecord);

    router.push({
      pathname: "/readoreditmemory",
      params: {
        summary: memory.summary,
        timeOfRecord: memory.timeOfRecord,
        id: memory.id,
      },
    });
  };

  return (
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
          <Text style={styles.label}>Time of Record: </Text>
          <Text style={styles.bold}>
            {formatTimeOfRecord(memory.timeOfRecord)}
          </Text>
        </View>

        <TouchableOpacity onPress={handleSeeMore}>
          <Text style={styles.seeMore}>See More ...</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
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
