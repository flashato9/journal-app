import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns/format";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [currentTime, setCurrentTime] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireItem[]>(MOCK_QUESTIONNAIRE);

  useEffect(() => {
    // Set initial time
    setCurrentTime(formatDate(new Date()));

    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(formatDate(new Date()));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    console.log("Save memory:", {
      summary,
      images,
      questionnaire,
      timestamp: new Date(),
    });
    router.back();
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
    <TouchableOpacity onPress={handleSave} style={styles.headerSaveButton}>
      <MaterialIcons name="save" size={28} color="#007AFF" />
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
