import { formatISO, parse } from "date-fns";
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

// Helper function to combine day and formatted time into ISO datetime
function combineDateTime(day: string, formattedTime: string): string {
  // Parse the formatted time (e.g., "8:30 AM") into a date
  // Format: "yyyy-MM-dd h:mm a" matches "2026-07-04 8:30 AM"
  const parsedDate = parse(
    `${day} ${formattedTime}`,
    "yyyy-MM-dd h:mm a",
    new Date(),
  );
  // Convert to ISO format
  return formatISO(parsedDate);
}

export default function TimeOfDayMemoryCard({
  memory,
  day = new Date().toISOString().split("T")[0],
}: TimeOfDayMemoryCardProps) {
  const router = useRouter();

  const handleSeeMore = () => {
    // Combine day and timeOfRecord into ISO datetime
    console.log(
      "handleSeeMore - day:",
      day,
      "timeOfRecord:",
      memory.timeOfRecord,
    );
    const dateTimeOfRecord = combineDateTime(day, memory.timeOfRecord);
    console.log("dateTimeOfRecord result:", dateTimeOfRecord);

    router.push({
      pathname: "/readmemory",
      params: {
        summary: memory.summary,
        timeOfRecord: dateTimeOfRecord,
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Summary: </Text>
          <Text style={styles.bold}>{memory.summary}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Time of Record: </Text>
          <Text style={styles.bold}>{memory.timeOfRecord}</Text>
        </View>

        <TouchableOpacity onPress={handleSeeMore}>
          <Text style={styles.seeMore}>See More ...</Text>
        </TouchableOpacity>
      </View>
    </View>
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
