import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import {
  LocationTable,
  TimeMemoryTable,
  TimeMemoryMediaTable,
  TimeMemoryQATable,
} from "@/services/database";
import { deleteMedia } from "@/services/mediaStorage";
import {
  LocationState,
  MemoryFormState,
} from "@/components/memories/MemoryForm";
import { QuestionnaireItem } from "@/components/memories/QuestionnaireCard";

type SetMemoryState = Dispatch<SetStateAction<MemoryFormState>>;

// Loads the TimeMemory, its media, QA, and location into form state.
async function loadMemory(
  id: string | string[] | undefined,
  setIsLoading: (isLoading: boolean) => void,
  setTimeMemoryId: (timeMemoryId: number) => void,
  setMemoryState: SetMemoryState,
) {
  try {
    setIsLoading(true);

    if (!id) {
      throw new Error("Memory ID is missing");
    }

    const parsedTimeMemoryId = parseInt(id as string, 10);
    setTimeMemoryId(parsedTimeMemoryId);

    const timeMemory = TimeMemoryTable.getTimeMemoryById(parsedTimeMemoryId);
    if (!timeMemory) {
      throw new Error("Memory not found");
    }

    const mediaRecords =
      TimeMemoryMediaTable.getTimeMemoryMediaByTimeMemoryId(parsedTimeMemoryId);
    const qaRecords =
      TimeMemoryQATable.getTimeMemoryQAByTimeMemoryId(parsedTimeMemoryId);

    const questionnaire: QuestionnaireItem[] = qaRecords.map((qa) => {
      const item = {
        id: qa.id.toString(),
        question: qa.question,
        answer: qa.answer,
      };
      return item;
    });

    let location: LocationState = null;
    if (timeMemory.locationId) {
      const locationData = LocationTable.getLocationById(timeMemory.locationId);
      if (locationData) {
        location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          altitude: locationData.altitude,
        };
      }
    }

    const media = mediaRecords.map((item) => {
      const mediaItem = {
        id: item.id,
        uri: item.mediaUri,
        type: item.mediaType,
        mediaLibraryAssetId: item.mediaLibraryAssetId,
      };
      return mediaItem;
    });

    const loadedMemoryState: MemoryFormState = {
      dateTimeOfCapture: timeMemory.timeOfRecord,
      summary: timeMemory.summary,
      location,
      media,
      questionnaire,
      isEditable: false,
    };
    setMemoryState(loadedMemoryState);
  } catch (error) {
    console.error("Error loading memory:", error);
    Alert.alert(
      "Error",
      error instanceof Error ? error.message : "Failed to load memory",
    );
  } finally {
    setIsLoading(false);
  }
}

// Diffs the form state against the DB and writes the summary, media, and QA changes.
async function saveMemory(
  timeMemoryId: number | null,
  memoryState: MemoryFormState,
  setMemoryState: SetMemoryState,
  setIsSaving: (isSaving: boolean) => void,
) {
  try {
    setIsSaving(true);

    if (!timeMemoryId) {
      throw new Error("Memory ID not found");
    }

    if (!memoryState.summary.trim()) {
      Alert.alert("Error", "Summary cannot be empty");
      return;
    }

    const currentRecord = TimeMemoryTable.getTimeMemoryById(timeMemoryId);
    if (currentRecord && currentRecord.summary !== memoryState.summary) {
      TimeMemoryTable.updateTimeMemory(timeMemoryId, memoryState.summary);
    }

    const oldMedia =
      TimeMemoryMediaTable.getTimeMemoryMediaByTimeMemoryId(timeMemoryId);
    const currentMediaIds = new Set(
      memoryState.media.map((item) => item.id).filter((id) => id !== undefined),
    );
    const removedMedia = oldMedia.filter(
      (item) => !currentMediaIds.has(item.id),
    );
    const newMedia = memoryState.media.filter((item) => item.id === undefined);

    await Promise.all(
      removedMedia.map((item) =>
        deleteMedia(item.mediaUri, item.mediaType).catch((error) => {
          console.warn(`Failed to delete media file ${item.mediaUri}:`, error);
        }),
      ),
    );

    removedMedia.forEach((item) =>
      TimeMemoryMediaTable.deleteTimeMemoryMedia(item.id),
    );

    newMedia.forEach((item) => {
      TimeMemoryMediaTable.createTimeMemoryMedia(
        timeMemoryId,
        item.uri,
        item.type,
        item.mediaLibraryAssetId ?? null,
      );
    });

    const oldQA = TimeMemoryQATable.getTimeMemoryQAByTimeMemoryId(timeMemoryId);
    const oldQAById = new Map(oldQA.map((qa) => [qa.id.toString(), qa]));
    const currentQAIds = new Set(memoryState.questionnaire.map((qa) => qa.id));

    memoryState.questionnaire.forEach((qa) => {
      const existing = oldQAById.get(qa.id);
      if (!existing) {
        TimeMemoryQATable.createTimeMemoryQA(
          timeMemoryId,
          qa.question,
          qa.answer,
        );
      } else if (
        existing.question !== qa.question ||
        existing.answer !== qa.answer
      ) {
        TimeMemoryQATable.updateTimeMemoryQA(
          existing.id,
          qa.question,
          qa.answer,
        );
      }
    });

    oldQA
      .filter((qa) => !currentQAIds.has(qa.id.toString()))
      .forEach((qa) => TimeMemoryQATable.deleteTimeMemoryQA(qa.id));

    const exitEditMode = (prev: MemoryFormState) => {
      const next = { ...prev, isEditable: false };
      return next;
    };
    setMemoryState(exitEditMode);

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
}

// Switches the form into edit mode.
function enterEditMode(setMemoryState: SetMemoryState) {
  const editableState = (prev: MemoryFormState) => {
    const next = { ...prev, isEditable: true };
    return next;
  };
  setMemoryState(editableState);
}

// Owns the read/edit memory form state: loads on focus, saves, and toggles edit mode.
export function useReadOrEditMemory() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeMemoryId, setTimeMemoryId] = useState<number | null>(null);
  const initialMemoryState: MemoryFormState = {
    dateTimeOfCapture: "",
    summary: "",
    location: null,
    media: [],
    questionnaire: [],
    isEditable: false,
  };
  const [memoryState, setMemoryState] =
    useState<MemoryFormState>(initialMemoryState);

  useFocusEffect(
    useCallback(() => {
      loadMemory(params.id, setIsLoading, setTimeMemoryId, setMemoryState);
    }, [params.id]),
  );

  const handleSave = () =>
    saveMemory(timeMemoryId, memoryState, setMemoryState, setIsSaving);
  const handleEditMode = () => enterEditMode(setMemoryState);

  return {
    isLoading,
    isSaving,
    memoryState,
    setMemoryState,
    handleSave,
    handleEditMode,
  };
}
