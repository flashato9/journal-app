import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { useCallback, useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { DayMemoryTable, UserTable } from "@/services/database";
import { DailyMemorySummary } from "@/components/memories/FullDayMemoryCard";

// Fetches today's + past DayMemory summaries for the given user.
function fetchMemories(
  username: string | null,
  isLoggedIn: boolean,
  setMemories: (memories: DailyMemorySummary[]) => void,
  setIsLoading: (isLoading: boolean) => void,
) {
  if (!isLoggedIn || !username) return;

  setIsLoading(true);
  try {
    const userId = UserTable.getUserIdByUsername(username);
    if (!userId) {
      throw new Error(`User not found in database: ${username}`);
    }

    const today = format(new Date(), "yyyy-MM-dd");
    if (!DayMemoryTable.isDayMemoryExists(userId, today)) {
      DayMemoryTable.createDayMemory(userId, today, "Summary TBD");
    }

    const dayMemories = DayMemoryTable.getDayMemoriesByUserId(userId);
    const memorySummaries = dayMemories.map((dm) => ({
      id: dm.id.toString(),
      summary: dm.summary || "",
      day: format(parse(dm.day, "yyyy-MM-dd", new Date()), "MMMM do, yyyy"),
    }));

    setMemories(memorySummaries);
  } catch (error) {
    console.error("Error fetching memories:", error);
    setMemories([]);
  } finally {
    setIsLoading(false);
  }
}

// Loads the current user's day-memory summaries, refetching on screen focus.
export function useMemoriesList() {
  const { username, isLoggedIn } = useContext(AuthContext);
  const [memories, setMemories] = useState<DailyMemorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMemories(username, isLoggedIn, setMemories, setIsLoading);
    }, [username, isLoggedIn]),
  );

  return { memories, isLoading };
}
