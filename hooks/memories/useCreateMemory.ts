import { format } from "date-fns/format";
import { formatISO } from "date-fns/formatISO";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import {
  DayMemoryTable,
  LocationTable,
  TimeMemoryTable,
  TimeMemoryMediaTable,
  TimeMemoryQATable,
  UserTable,
} from "@/services/database";
import { MemoryFormState } from "@/components/memories/MemoryForm";
import { QuestionnaireItem } from "@/components/memories/QuestionnaireCard";

type AppRouter = ReturnType<typeof useRouter>;
type SetMemoryState = Dispatch<SetStateAction<MemoryFormState>>;

const DEFAULT_QUESTIONNAIRE: QuestionnaireItem[] = [
  { id: "1", question: "What do you see?", answer: "" },
  { id: "2", question: "What do you hear?", answer: "" },
  { id: "3", question: "What do you smell?", answer: "" },
  { id: "4", question: "What do you taste?", answer: "" },
  { id: "5", question: "What is the closest thing you can touch?", answer: "" },
  { id: "6", question: "What does it feel like?", answer: "" },
  { id: "7", question: "How does the temperature feel like?", answer: "" },
  { id: "8", question: "Why did you decide to come here?", answer: "" },
];

// Requests foreground location permission and fills in the memory's location.
async function fetchCurrentLocation(setMemoryState: SetMemoryState) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission not granted");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const applyLocation = (prev: MemoryFormState) => {
      const next = {
        ...prev,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          altitude: currentLocation.coords.altitude,
        },
      };
      return next;
    };
    setMemoryState(applyLocation);
  } catch (error) {
    console.error("Error getting location:", error);
  }
}

// Validates and persists the memory (TimeMemory, location, media, and QA), then navigates back.
async function saveMemory(
  username: string | null,
  memoryState: MemoryFormState,
  router: AppRouter,
  setIsSaving: (isSaving: boolean) => void,
) {
  setIsSaving(true);
  try {
    if (!username) {
      console.warn("Username is not set in AuthContext - user session ended");
      Alert.alert("Error", "User session has ended. Please log back in.");
      return;
    }

    if (!memoryState.summary.trim()) {
      Alert.alert("Validation Error", "Please enter a summary");
      return;
    }

    const userId = UserTable.getUserIdByUsername(username);
    if (!userId) {
      throw new Error(`User not found in database: ${username}`);
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const dayMemory = DayMemoryTable.getDayMemoryByUserIdAndDay(userId, today);
    if (!dayMemory) {
      throw new Error(`Day memory not found for today: ${today}`);
    }

    let locationId: number | undefined;
    if (memoryState.location && typeof memoryState.location !== "string") {
      locationId = LocationTable.insertLocation(
        userId,
        memoryState.location.latitude,
        memoryState.location.longitude,
        memoryState.location.altitude,
      );
    }

    const timeMemoryId = TimeMemoryTable.createTimeMemory(
      dayMemory.id,
      memoryState.dateTimeOfCapture,
      memoryState.summary,
      locationId,
    );

    for (const item of memoryState.media) {
      TimeMemoryMediaTable.createTimeMemoryMedia(
        timeMemoryId,
        item.uri,
        item.type,
        item.mediaLibraryAssetId ?? null,
      );
    }

    for (const item of memoryState.questionnaire) {
      TimeMemoryQATable.createTimeMemoryQA(
        timeMemoryId,
        item.question,
        item.answer,
      );
    }

    Alert.alert("Success", "Memory saved successfully");
    router.back();
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

// Owns the create-memory form state, location fetch, and save handler.
export function useCreateMemory() {
  const router = useRouter();
  const { username } = useContext(AuthContext);
  const { sharedMediaUri, sharedMediaType, sharedMediaAssetId } =
    useLocalSearchParams<{
      sharedMediaUri?: string;
      sharedMediaType?: "image" | "video";
      sharedMediaAssetId?: string;
    }>();
  const [isSaving, setIsSaving] = useState(false);
  const initialMemoryState: MemoryFormState = {
    dateTimeOfCapture: formatISO(new Date()),
    summary: "",
    location: "Loading",
    media: sharedMediaUri
      ? [
          {
            uri: sharedMediaUri,
            type: sharedMediaType ?? "image",
            mediaLibraryAssetId: sharedMediaAssetId ?? null,
          },
        ]
      : [],
    questionnaire: DEFAULT_QUESTIONNAIRE,
    isEditable: true,
  };
  const [memoryState, setMemoryState] =
    useState<MemoryFormState>(initialMemoryState);

  useEffect(() => {
    fetchCurrentLocation(setMemoryState);
  }, []);

  const handleSave = () =>
    saveMemory(username, memoryState, router, setIsSaving);

  return { memoryState, setMemoryState, isSaving, handleSave };
}
