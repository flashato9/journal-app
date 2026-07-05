import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useContext, useState } from "react";
import { Alert, BackHandler, FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import {
    createDayMemory,
    getDayMemoriesByUserId,
    getUserIdByUsername,
    isDayMemoryExists,
} from "../../services/database";
import { stopLocationTracking } from "../../services/locationService";
import Header from "../components/Header";
import FullDayMemoryCard, {
    DailyMemorySummary,
} from "./components/FullDayMemoryCard";

export default function AllMemoriesScreen() {
  const router = useRouter();
  const { username, setUsername } = useContext(AuthContext);
  const [memories, setMemories] = useState<DailyMemorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch memories when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Skip if user is logging out (username cleared)
      if (!username) {
        console.warn(
          "Username is not set in AuthContext - skipping memory fetch",
        );
        return;
      }

      setIsLoading(true);
      try {
        const userId = getUserIdByUsername(username);
        if (!userId) {
          throw new Error(`User not found in database: ${username}`);
        }

        // Check and create today's DayMemory if it doesn't exist
        const today = format(new Date(), "yyyy-MM-dd");
        if (!isDayMemoryExists(userId, today)) {
          createDayMemory(userId, today, "Summary TBD");
          console.log("Created DayMemory for today:", today);
        }

        const dayMemories = getDayMemoriesByUserId(userId);
        const memorySummaries = dayMemories.map((dm) => ({
          id: dm.id.toString(),
          summary: dm.summary || "",
          day: format(parse(dm.day, "yyyy-MM-dd", new Date()), "MMMM do, yyyy"),
        }));

        console.log("Fetched memories:", memorySummaries);
        setMemories(memorySummaries);
      } catch (error) {
        console.error("Error fetching memories:", error);
        setMemories([]);
      } finally {
        setIsLoading(false);
      }
    }, [username]),
  );

  // Intercept back navigation (Android back button)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Logout?", "Going back will log you out. Continue?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Logout",
            onPress: async () => {
              try {
                // Stop location tracking
                await stopLocationTracking();
                console.log("Location tracking stopped");
              } catch (error) {
                console.error("Error stopping location tracking:", error);
              }

              // Clear username from SecureStore (for location tracking background task)
              try {
                await SecureStore.deleteItemAsync("currentUsername");
              } catch (error) {
                console.error(
                  "Error clearing username from SecureStore:",
                  error,
                );
              }

              // Clear auth context
              setUsername(null);

              // Navigate to login
              router.push("/(welcome)/login");
            },
            style: "destructive",
          },
        ]);
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [router]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="All Memories" />

      {/* Memories List */}
      <FlatList
        data={memories}
        renderItem={({ item }) => <FullDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "Loading..." : "No memories yet"}
          </Text>
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 32,
  },
  listContent: {
    paddingVertical: 8,
  },
});
