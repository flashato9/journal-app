import { FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import FullDayMemoryCard from "@/components/memories/FullDayMemoryCard";
import { getColors } from "@/constants/colors";
import { useLogoutOnBackPress } from "@/hooks/memories/useLogoutOnBackPress";
import { useMemoriesList } from "@/hooks/memories/useMemoriesList";

const colors = getColors();

export default function AllMemoriesScreen() {
  const { memories, isLoading } = useMemoriesList();
  useLogoutOnBackPress();

  const content = (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title="All Memories" />
      <FlatList
        data={memories}
        renderItem={({ item }) => <FullDayMemoryCard memory={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <LoadingIndicator message="Loading memories..." />
          ) : (
            <Text style={styles.emptyText}>No memories yet</Text>
          )
        }
      />
    </SafeAreaView>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 32,
  },
  listContent: {
    paddingBottom: 8,
  },
});
