import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { useCallback, useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { logError } from "@/services/appLogger";
import {
  DayMemoryTable,
  TimeMemoryTable,
  UserTable,
} from "@/services/database";
import { DailyMemorySummary } from "@/components/memories/FullDayMemoryCard";

// A day is shown if it's today, or it already has at least one memory recorded.
function isDayMemoryVisible(
  dayMemoryId: number,
  day: string,
  today: string,
): boolean {
  const isToday = day === today;
  if (isToday) {
    return true;
  }
  const timeMemories =
    TimeMemoryTable.getTimeMemoriesByDayMemoryId(dayMemoryId);
  const hasTimeMemories = timeMemories.length > 0;
  return hasTimeMemories;
}

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
    const visibleDayMemories = dayMemories.filter((dm) => {
      const isVisible = isDayMemoryVisible(dm.id, dm.day, today);
      return isVisible;
    });
    const memorySummaries = visibleDayMemories.map((dm) => {
      const summary = {
        id: dm.id.toString(),
        summary: dm.summary || "",
        day: dm.day,
      };
      return summary;
    });

    setMemories(memorySummaries);
  } catch (error) {
    logError("Error fetching memories:", error);
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
