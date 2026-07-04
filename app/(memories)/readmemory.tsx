import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
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

interface Memory {
  summary: string;
  timeOfRecord: string; // ISO format datetime
  images: string[]; // Array of image URIs
  questionnaire: QuestionnaireItem[];
}

// Mock database fetch function
async function fetchMemoryData(
  summary: string,
  timeOfRecord: string,
): Promise<Memory> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // timeOfRecord is now a complete ISO datetime passed from TimeOfDayMemoryCard
  console.log("fetchMemoryData params:", { summary, timeOfRecord });

  // Mock API call - in real app, this would query a database
  return {
    summary,
    timeOfRecord,
    images: [
      require("../../assets/memories/fell_in_snow.jpg"),
      require("../../assets/memories/i_kayak.jpg"),
      require("../../assets/memories/tight_rope.jpg"),
    ],
    questionnaire: [
      {
        id: "1",
        question: "How was your mood today?",
        answer: "Feeling great! Had a productive day.",
      },
      {
        id: "2",
        question: "What was the highlight of your day?",
        answer: "Completed an important project successfully.",
      },
      {
        id: "3",
        question: "What challenges did you face?",
        answer: "Had to deal with some unexpected issues but managed well.",
      },
      {
        id: "4",
        question: "Who did you spend time with?",
        answer: "Spent time with the team and had a great meeting.",
      },
    ],
  };
}

export default function ReadMemoryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState<string>("");
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [editedQuestionnaire, setEditedQuestionnaire] = useState<
    QuestionnaireItem[]
  >([]);

  const handleEditMode = () => {
    if (memory) {
      setEditedSummary(memory.summary);
      setEditedImages(memory.images);
      setEditedQuestionnaire(memory.questionnaire);
    }
    setIsEditMode(true);
  };

  const handleSave = () => {
    if (memory) {
      setMemory({
        ...memory,
        summary: editedSummary,
        images: editedImages,
        questionnaire: editedQuestionnaire,
      });
      setIsEditMode(false);
    }
  };

  const handleImagesSelected = (newImages: string[]) => {
    setEditedImages(newImages);
  };

  const handleQuestionnaireChange = (id: string, answer: string) => {
    setEditedQuestionnaire((prev) =>
      prev.map((item) => (item.id === id ? { ...item, answer } : item)),
    );
  };

  useFocusEffect(
    useCallback(() => {
      const loadMemory = async () => {
        try {
          setIsLoading(true);
          const fetchedMemory = await fetchMemoryData(
            (params.summary as string) || "",
            (params.timeOfRecord as string) || "",
          );
          setMemory(fetchedMemory);
        } catch (error) {
          console.error("Error loading memory:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadMemory();
    }, [params.summary, params.timeOfRecord]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!memory) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Memory Not Found" />
      </SafeAreaView>
    );
  }

  const headerTitle = `Memory: ${
    memory.timeOfRecord ? formatDate(new Date(memory.timeOfRecord)) : "No date"
  }`;

  const actionIcons = isEditMode ? (
    <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
      <MaterialIcons name="save" size={28} color="#007AFF" />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={handleEditMode} style={styles.headerButton}>
      <MaterialIcons name="edit" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} actionIcons={actionIcons} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Summary Section */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Summary:</Text>
          <TextInput
            style={[styles.readOnlyInput, !isEditMode && styles.inputReadOnly]}
            value={isEditMode ? editedSummary : memory?.summary || ""}
            onChangeText={isEditMode ? setEditedSummary : undefined}
            editable={isEditMode}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Time of Capture Section */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Time of Capture:</Text>
          <Text style={styles.inlineTimeDisplay}>
            {memory?.timeOfRecord
              ? formatTime(new Date(memory.timeOfRecord))
              : "No time"}
          </Text>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Images:</Text>
          <UploadImages
            images={isEditMode ? editedImages : memory?.images || []}
            onImagesSelected={isEditMode ? handleImagesSelected : () => {}}
            isEditable={isEditMode}
          />
        </View>

        {/* Questionnaire Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Questionnaire:</Text>
          {(isEditMode ? editedQuestionnaire : memory?.questionnaire || []).map(
            (item) => (
              <QuestionnaireCard
                key={item.id}
                item={item}
                onChange={isEditMode ? handleQuestionnaireChange : () => {}}
                isEditable={isEditMode}
              />
            ),
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: 4,
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
  readOnlyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
  },
  inputReadOnly: {
    borderColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  inlineTimeDisplay: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
