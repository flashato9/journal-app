import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createTimeMemoryImage,
  createTimeMemoryQA,
  deleteTimeMemoryImagesByTimeMemoryId,
  deleteTimeMemoryQAByTimeMemoryId,
  getTimeMemoryById,
  getTimeMemoryImagesByTimeMemoryId,
  getTimeMemoryQAByTimeMemoryId,
  updateTimeMemory,
} from "../../services/database";
import { deleteImage } from "../../services/imageStorage";
import Header from "../components/Header";
import UploadImages from "./components/ImageGallery/UploadImages";
import QuestionnaireCard, {
  QuestionnaireItem,
} from "./components/QuestionnaireCard";

function formatTime(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "h:mmaa");
  } catch (error) {
    return "Unknown time";
  }
}

function formatDate(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "h:mmaa MMMM do, yyyy");
  } catch (error) {
    return "Unknown date";
  }
}

interface Memory {
  id: number;
  summary: string;
  timeOfRecord: string; // ISO format datetime
  images: string[]; // Array of image URIs
  questionnaire: QuestionnaireItem[];
}

export default function ReadMemoryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!memory) {
        throw new Error("Memory data not loaded");
      }

      // Validate summary
      if (!editedSummary.trim()) {
        Alert.alert("Error", "Summary cannot be empty");
        return;
      }

      const timeMemoryId = memory.id;

      // Update TimeMemory summary
      updateTimeMemory(timeMemoryId, editedSummary);

      // Get old images to delete their files from storage
      const oldImages = getTimeMemoryImagesByTimeMemoryId(timeMemoryId);

      // Delete old image files from disk
      await Promise.all(
        oldImages.map((img) =>
          deleteImage(img.imageUri).catch((error) => {
            console.warn(`Failed to delete image file ${img.imageUri}:`, error);
            // Don't throw - continue with other deletions
          }),
        ),
      );

      // Delete old images and QA records from database
      deleteTimeMemoryImagesByTimeMemoryId(timeMemoryId);
      deleteTimeMemoryQAByTimeMemoryId(timeMemoryId);

      // Insert new images
      editedImages.forEach((imageUri) => {
        createTimeMemoryImage(timeMemoryId, imageUri);
      });

      // Insert new QA records (only non-empty answers)
      editedQuestionnaire.forEach((qa) => {
        if (qa.answer.trim()) {
          createTimeMemoryQA(timeMemoryId, qa.question, qa.answer);
        }
      });

      // Update local state with saved changes
      setMemory({
        ...memory,
        summary: editedSummary,
        images: editedImages,
        questionnaire: editedQuestionnaire,
      });

      setIsEditMode(false);
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

          // Get timeMemoryId from params
          if (!params.id) {
            throw new Error("Memory ID is missing");
          }

          const timeMemoryId = parseInt(params.id as string, 10);

          // Fetch TimeMemory record
          const timeMemory = getTimeMemoryById(timeMemoryId);
          if (!timeMemory) {
            throw new Error("Memory not found");
          }

          // Fetch related images and QA records
          const images = getTimeMemoryImagesByTimeMemoryId(timeMemoryId);
          const qaRecords = getTimeMemoryQAByTimeMemoryId(timeMemoryId);

          // Convert QA records to QuestionnaireItem format
          const questionnaire: QuestionnaireItem[] = qaRecords.map((qa) => ({
            id: qa.id.toString(),
            question: qa.question,
            answer: qa.answer,
          }));

          const fetchedMemory: Memory = {
            id: timeMemoryId,
            summary: timeMemory.summary,
            timeOfRecord: timeMemory.timeOfRecord,
            images: images.map((img) => img.imageUri),
            questionnaire,
          };

          console.log("Fetched memory from database:", fetchedMemory);
          setMemory(fetchedMemory);
        } catch (error) {
          console.error("Error loading memory:", error);
          setMemory(null);
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
    memory.timeOfRecord ? formatDate(memory.timeOfRecord) : "No date"
  }`;

  const actionIcons = isEditMode ? (
    <TouchableOpacity
      onPress={handleSave}
      style={[styles.headerButton, isSaving && { opacity: 0.5 }]}
      disabled={isSaving}
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
            {memory?.timeOfRecord ? formatTime(memory.timeOfRecord) : "No time"}
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
