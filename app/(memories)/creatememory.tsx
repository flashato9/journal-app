import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { formatISO } from "date-fns/formatISO";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import {
    createTimeMemory,
    createTimeMemoryImage,
    createTimeMemoryQA,
    getDayMemoryByUserIdAndDay,
    getUserIdByUsername,
    insertLocation,
} from "../../services/database";
import Header from "../components/Header";
import MemoryForm, { MemoryFormState } from "./components/MemoryForm";
import { QuestionnaireItem } from "./components/QuestionnaireCard";

// Default questionnaire with sensory prompts
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

export default function CreateMemoryScreen() {
  const router = useRouter();
  const { username } = useContext(AuthContext);
  const [isSaving, setIsSaving] = useState(false);
  const [memoryState, setMemoryState] = useState<MemoryFormState>({
    dateTimeOfCapture: formatISO(new Date()),
    summary: "",
    location: "Loading",
    images: [],
    questionnaire: DEFAULT_QUESTIONNAIRE,
    isEditable: true,
  });

  // Fetch location on mount
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission not granted");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setMemoryState((prev) => ({
          ...prev,
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            altitude: currentLocation.coords.altitude,
          },
        }));
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getCurrentLocation();
  }, []);

  const handleSave = async () => {
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

      // Get userId
      const userId = getUserIdByUsername(username);
      if (!userId) {
        throw new Error(`User not found in database: ${username}`);
      }

      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), "yyyy-MM-dd");

      // Get dayMemoryId for today
      const dayMemory = getDayMemoryByUserIdAndDay(userId, today);
      if (!dayMemory) {
        throw new Error(`Day memory not found for today: ${today}`);
      }

      // Insert location if available
      let locationId: number | undefined;
      if (memoryState.location && typeof memoryState.location !== "string") {
        locationId = insertLocation(
          userId,
          memoryState.location.latitude,
          memoryState.location.longitude,
          memoryState.location.altitude,
        );
        console.log("Created Location:", locationId);
      }

      const timeMemoryId = createTimeMemory(
        dayMemory.id,
        memoryState.dateTimeOfCapture,
        memoryState.summary,
        locationId,
      );
      console.log("Created TimeMemory:", timeMemoryId);

      // Create TimeMemoryImages
      for (const imageUri of memoryState.images) {
        createTimeMemoryImage(timeMemoryId, imageUri);
      }
      console.log("Created TimeMemoryImages:", memoryState.images.length);

      // Create TimeMemoryQA entries (all items, including empty answers)
      for (const item of memoryState.questionnaire) {
        createTimeMemoryQA(timeMemoryId, item.question, item.answer);
      }
      console.log(
        "Created TimeMemoryQA entries:",
        memoryState.questionnaire.length,
      );

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
  };

  const headerTitle = `Memory: ${format(new Date(memoryState.dateTimeOfCapture), "h:mmaa MMMM do, yyyy")}`;

  const actionIcons = (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerSaveButton, isSaving && styles.buttonDisabled]}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <MaterialIcons name="save" size={28} color="#007AFF" />
      )}
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
  headerSaveButton: {
    marginRight: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
