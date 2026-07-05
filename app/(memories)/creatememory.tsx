import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { formatISO } from "date-fns/formatISO";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import {
    createTimeMemory,
    createTimeMemoryImage,
    createTimeMemoryQA,
    getDayMemoryByUserIdAndDay,
    getUserIdByUsername,
} from "../../services/database";
import Header from "../components/Header";
import UploadImages from "./components/ImageGallery/UploadImages";
import QuestionnaireCard, {
    QuestionnaireItem,
} from "./components/QuestionnaireCard";

function formatTime(date: Date): string {
  return format(date, "h:mmaa");
}

function formatDate(date: Date): string {
  return format(date, "h:mmaa MMMM do, yyyy");
}

// Mock questionnaire data
const MOCK_QUESTIONNAIRE: QuestionnaireItem[] = [
  { id: "1", question: "How was your mood today?", answer: "" },
  { id: "2", question: "What was the highlight of your day?", answer: "" },
  { id: "3", question: "What challenges did you face?", answer: "" },
  { id: "4", question: "Who did you spend time with?", answer: "" },
];

export default function CreateMemoryScreen() {
  const router = useRouter();
  const { username } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireItem[]>(MOCK_QUESTIONNAIRE);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set initial time
    setCurrentTime(formatDate(new Date()));

    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(formatDate(new Date()));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!username) {
        throw new Error("Username is not set in AuthContext");
      }

      if (!summary.trim()) {
        Alert.alert("Validation Error", "Please enter a summary");
        setIsSaving(false);
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

      // Create TimeMemory with ISO datetime
      const timeOfRecord = formatISO(new Date());
      const timeMemoryId = createTimeMemory(
        dayMemory.id,
        timeOfRecord,
        summary,
      );
      console.log("Created TimeMemory:", timeMemoryId);

      // Create TimeMemoryImages
      for (const imageUri of images) {
        createTimeMemoryImage(timeMemoryId, imageUri);
      }
      console.log("Created TimeMemoryImages:", images.length);

      // Create TimeMemoryQA entries (only for non-empty answers)
      for (const item of questionnaire) {
        if (item.answer.trim()) {
          createTimeMemoryQA(timeMemoryId, item.question, item.answer);
        }
      }
      const answeredCount = questionnaire.filter((q) => q.answer.trim()).length;
      console.log("Created TimeMemoryQA entries:", answeredCount);

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

  const handleImagesSelected = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleQuestionnaireChange = (id: string, answer: string) => {
    setQuestionnaire((prev) =>
      prev.map((item) => (item.id === id ? { ...item, answer } : item)),
    );
  };

  const timeDisplay = formatTime(new Date());

  const actionIcons = (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving}
      style={[styles.headerSaveButton, isSaving && styles.buttonDisabled]}
    >
      <MaterialIcons
        name="save"
        size={28}
        color={isSaving ? "#ccc" : "#007AFF"}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`Memory: ${currentTime}`} actionIcons={actionIcons} />

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Summary Section */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Summary:</Text>
          <TextInput
            style={styles.inlineTextInput}
            placeholder="What happened today?"
            value={summary}
            onChangeText={setSummary}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        {/* Time of Capture Section */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Time of Capture:</Text>
          <Text style={styles.inlineTimeDisplay}>{timeDisplay}</Text>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Images:</Text>
          <UploadImages
            images={images}
            onImagesSelected={handleImagesSelected}
          />
        </View>

        {/* Questionnaire Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Questionnaire:</Text>
          {questionnaire.map((item) => (
            <QuestionnaireCard
              key={item.id}
              item={item}
              onChange={handleQuestionnaireChange}
            />
          ))}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    textAlignVertical: "top",
  },
  inlineSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 4,
  },
  inlineLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  inlineTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    textAlignVertical: "top",
  },
  timeDisplay: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    paddingVertical: 8,
  },
  inlineTimeDisplay: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
