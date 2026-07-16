import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createTimeMemoryMedia,
  createTimeMemoryQA,
  deleteTimeMemoryMediaByTimeMemoryId,
  deleteTimeMemoryQAByTimeMemoryId,
  getLocationById,
  getTimeMemoryById,
  getTimeMemoryMediaByTimeMemoryId,
  getTimeMemoryQAByTimeMemoryId,
  updateTimeMemory,
} from "../../services/database";
import { deleteMedia } from "../../services/mediaStorage";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import MemoryForm, {
  LocationState,
  MemoryFormState,
} from "@/components/memories/MemoryForm";
import { QuestionnaireItem } from "@/components/memories/QuestionnaireCard";

function formatDate(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "h:mmaa MMMM do, yyyy");
  } catch {
    return "Unknown date";
  }
}

export default function ReadMemoryScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeMemoryId, setTimeMemoryId] = useState<number | null>(null);
  const [memoryState, setMemoryState] = useState<MemoryFormState>({
    dateTimeOfCapture: "",
    summary: "",
    location: null,
    media: [],
    questionnaire: [],
    isEditable: false,
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!timeMemoryId) {
        throw new Error("Memory ID not found");
      }

      // Validate summary
      if (!memoryState.summary.trim()) {
        Alert.alert("Error", "Summary cannot be empty");
        return;
      }

      // Update TimeMemory summary
      updateTimeMemory(timeMemoryId, memoryState.summary);

      // Get old media to delete their files from storage
      const oldMedia = getTimeMemoryMediaByTimeMemoryId(timeMemoryId);

      // Delete old media files from disk
      await Promise.all(
        oldMedia.map((item) =>
          deleteMedia(item.mediaUri, item.mediaType).catch((error) => {
            console.warn(
              `Failed to delete media file ${item.mediaUri}:`,
              error,
            );
            // Don't throw - continue with other deletions
          }),
        ),
      );

      // Delete old media and QA records from database
      deleteTimeMemoryMediaByTimeMemoryId(timeMemoryId);
      deleteTimeMemoryQAByTimeMemoryId(timeMemoryId);

      // Insert new media (images, videos, and sound recordings)
      memoryState.media.forEach((item) => {
        createTimeMemoryMedia(
          timeMemoryId,
          item.uri,
          item.type,
          item.mediaLibraryAssetId ?? null,
        );
      });

      // Insert new QA records (all items, including empty answers)
      memoryState.questionnaire.forEach((qa) => {
        createTimeMemoryQA(timeMemoryId, qa.question, qa.answer);
      });

      // Exit edit mode
      setMemoryState((prev) => ({
        ...prev,
        isEditable: false,
      }));

      Alert.alert("Success", "Memory updated successfully");
    } catch (error) {
      console.error("Error saving memory:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save memory",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMode = () => {
    setMemoryState((prev) => ({
      ...prev,
      isEditable: true,
    }));
  };

  useFocusEffect(
    useCallback(() => {
      const loadMemory = async () => {
        try {
          setIsLoading(true);

          // Get timeMemoryId from params
          if (!params.id) {
            throw new Error("Memory ID is missing");
          }

          const id = parseInt(params.id as string, 10);
          setTimeMemoryId(id);

          // Fetch TimeMemory record
          const timeMemory = getTimeMemoryById(id);
          if (!timeMemory) {
            throw new Error("Memory not found");
          }

          // Fetch related media and QA records
          const mediaRecords = getTimeMemoryMediaByTimeMemoryId(id);
          const qaRecords = getTimeMemoryQAByTimeMemoryId(id);

          // Convert QA records to QuestionnaireItem format
          const questionnaire: QuestionnaireItem[] = qaRecords.map((qa) => ({
            id: qa.id.toString(),
            question: qa.question,
            answer: qa.answer,
          }));

          // Fetch location if available
          let location: LocationState = null;
          if (timeMemory.locationId) {
            const locationData = getLocationById(timeMemory.locationId);
            if (locationData) {
              location = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                altitude: locationData.altitude,
              };
            }
          }

          setMemoryState({
            dateTimeOfCapture: timeMemory.timeOfRecord,
            summary: timeMemory.summary,
            location,
            media: mediaRecords.map((item) => ({
              uri: item.mediaUri,
              type: item.mediaType,
              mediaLibraryAssetId: item.mediaLibraryAssetId,
            })),
            questionnaire,
            isEditable: false,
          });
        } catch (error) {
          console.error("Error loading memory:", error);
          Alert.alert(
            "Error",
            error instanceof Error ? error.message : "Failed to load memory",
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadMemory();
    }, [params.id]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator message="Loading memory..." />
      </SafeAreaView>
    );
  }

  const headerTitle = `Memory: ${formatDate(memoryState.dateTimeOfCapture)}`;

  const actionIcons = memoryState.isEditable ? (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerButton, isSaving && { opacity: 0.5 }]}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <MaterialIcons name="save" size={28} color="#007AFF" />
      )}
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={handleEditMode} style={styles.headerButton}>
      <MaterialIcons name="edit" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} actionIcons={actionIcons} />
      <MemoryForm storage={memoryState} onStorageChange={setMemoryState} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerButton: {
    paddingHorizontal: 4,
  },
});
