import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { DayMemoryTable, TimeMemoryTable } from "@/services/database";
import { TimeOfDayMemory } from "@/components/memories/TimeOfDayMemoryCard";

// Fetches the day's summary and its time-memories for the given day-memory id.
function fetchDayMemories(
  id: string | string[] | undefined,
  setDayMemoryId: (dayMemoryId: number) => void,
  setDaySummary: (summary: string) => void,
  setMemories: (memories: TimeOfDayMemory[]) => void,
  setIsLoading: (isLoading: boolean) => void,
) {
  setIsLoading(true);
  try {
    if (!id) {
      throw new Error("Day memory ID is missing");
    }

    const parsedDayMemoryId = parseInt(id as string, 10);
    setDayMemoryId(parsedDayMemoryId);

    const dayMemory = DayMemoryTable.getDayMemoryById(parsedDayMemoryId);
    if (dayMemory) {
      setDaySummary(dayMemory.summary || "");
    }

    const timeMemories =
      TimeMemoryTable.getTimeMemoriesByDayMemoryId(parsedDayMemoryId);
    const memorySummaries = timeMemories.map((tm) => {
      const summary = {
        id: tm.id.toString(),
        summary: tm.summary,
        timeOfRecord: tm.timeOfRecord,
      };
      return summary;
    });

    setMemories(memorySummaries);
  } catch (error) {
    console.error("Error fetching time memories:", error);
    setMemories([]);
  } finally {
    setIsLoading(false);
  }
}

// Persists the edited day summary to the database.
function saveDaySummary(
  dayMemoryId: number | null,
  newSummary: string,
  setDaySummary: (summary: string) => void,
) {
  try {
    if (!dayMemoryId) {
      throw new Error("Day memory ID not found");
    }

    DayMemoryTable.updateDayMemory(dayMemoryId, newSummary);
    setDaySummary(newSummary);
    Alert.alert("Success", "Summary updated successfully");
  } catch (error) {
    console.error("Error saving summary:", error);
    Alert.alert(
      "Error",
      error instanceof Error ? error.message : "Failed to save summary",
    );
  }
}

// Owns the day's summary and time-memories, refetching on screen focus.
export function useDayMemories() {
  const { id } = useLocalSearchParams();
  const [memories, setMemories] = useState<TimeOfDayMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dayMemoryId, setDayMemoryId] = useState<number | null>(null);
  const [daySummary, setDaySummary] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      fetchDayMemories(
        id,
        setDayMemoryId,
        setDaySummary,
        setMemories,
        setIsLoading,
      );
    }, [id]),
  );

  const handleSaveSummary = (newSummary: string) =>
    saveDaySummary(dayMemoryId, newSummary, setDaySummary);

  return { memories, isLoading, daySummary, handleSaveSummary };
}
