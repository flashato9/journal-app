import { format } from "date-fns/format";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingIndicator from "@/components/LoadingIndicator";
import UploadMedia, {
  MediaItem,
} from "@/components/memories/MediaGallery/UploadMedia";
import QuestionnaireCard, {
  QuestionnaireItem,
} from "@/components/memories/QuestionnaireCard";

export interface LocationInfo {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

export type LocationState = LocationInfo | null | "Loading";

export interface MemoryFormState {
  dateTimeOfCapture: string;
  summary: string;
  location: LocationState;
  media: MediaItem[];
  questionnaire: QuestionnaireItem[];
  isEditable: boolean;
}

export interface MemoryFormProps {
  storage: MemoryFormState;
  onStorageChange: (storage: MemoryFormState) => void;
}

export default function MemoryForm({
  storage,
  onStorageChange,
}: MemoryFormProps) {
  const handleSummaryChange = (newSummary: string) => {
    const nextStorage = { ...storage, summary: newSummary };
    onStorageChange(nextStorage);
  };

  const handleMediaSelected = (newMedia: MediaItem[]) => {
    const nextStorage = { ...storage, media: newMedia };
    onStorageChange(nextStorage);
  };

  const handleQuestionnaireChange = (id: string, answer: string) => {
    const updated = storage.questionnaire.map((item) =>
      item.id === id ? { ...item, answer } : item,
    );
    const nextStorage = { ...storage, questionnaire: updated };
    onStorageChange(nextStorage);
  };

  const handleQuestionChange = (id: string, question: string) => {
    const updated = storage.questionnaire.map((item) =>
      item.id === id ? { ...item, question } : item,
    );
    const nextStorage = { ...storage, questionnaire: updated };
    onStorageChange(nextStorage);
  };

  const handleRemoveQuestionnaire = (id: string) => {
    const remaining = storage.questionnaire.filter((item) => item.id !== id);
    const nextStorage = { ...storage, questionnaire: remaining };
    onStorageChange(nextStorage);
  };

  const handleAddQuestionnaire = () => {
    const newQuestionnaire: QuestionnaireItem = {
      id: Date.now().toString(),
      question: "enter your question here",
      answer: "enter your answer here",
    };
    const updated = [...storage.questionnaire, newQuestionnaire];
    const nextStorage = { ...storage, questionnaire: updated };
    onStorageChange(nextStorage);
  };

  const timeDisplay = storage.dateTimeOfCapture
    ? format(new Date(storage.dateTimeOfCapture), "h:mmaa")
    : "No time";

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Summary:</Text>
          <TextInput
            style={[
              styles.inlineTextInput,
              !storage.isEditable && styles.inputReadOnly,
            ]}
            placeholder="What happened today?"
            placeholderTextColor="#999"
            value={storage.summary}
            onChangeText={storage.isEditable ? handleSummaryChange : undefined}
            editable={storage.isEditable}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inlineSection}>
          <Text style={styles.inlineLabel}>Time of Capture:</Text>
          <Text style={styles.inlineTimeDisplay}>{timeDisplay}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location:</Text>
          {storage.location === "Loading" ? (
            <LoadingIndicator message="Loading location..." />
          ) : storage.location !== null ? (
            <View style={styles.locationContent}>
              <Text style={styles.locationText}>
                Latitude: {storage.location.latitude.toFixed(6)}°
              </Text>
              <Text style={styles.locationText}>
                Longitude: {storage.location.longitude.toFixed(6)}°
              </Text>
              <Text style={styles.locationText}>
                Altitude:{" "}
                {storage.location.altitude
                  ? `${storage.location.altitude.toFixed(2)}m`
                  : "N/A"}
              </Text>
            </View>
          ) : (
            <Text style={styles.locationLoadingText}>No Location Info</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Media:</Text>
          <UploadMedia
            media={storage.media}
            onMediaSelected={
              storage.isEditable ? handleMediaSelected : () => {}
            }
            isEditable={storage.isEditable}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Questionnaire:</Text>
          {storage.questionnaire.length === 0 ? (
            <Text style={styles.emptyText}>No questionnaires</Text>
          ) : (
            storage.questionnaire.map((item) => (
              <QuestionnaireCard
                key={item.id}
                item={item}
                onChange={
                  storage.isEditable
                    ? (id: string, answer: string) =>
                        handleQuestionnaireChange(id, answer)
                    : () => {}
                }
                onQuestionChange={
                  storage.isEditable
                    ? (id: string, question: string) =>
                        handleQuestionChange(id, question)
                    : undefined
                }
                onRemove={
                  storage.isEditable
                    ? () => handleRemoveQuestionnaire(item.id)
                    : undefined
                }
                isEditable={storage.isEditable}
              />
            ))
          )}
          {storage.isEditable && (
            <TouchableOpacity
              style={styles.addQuestionnaireButton}
              onPress={handleAddQuestionnaire}
            >
              <Text style={styles.addQuestionnaireText}>Add Questionnaire</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  return content;
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
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
  inlineTimeDisplay: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  inputReadOnly: {
    borderColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  locationContent: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontFamily: "monospace",
  },
  locationLoadingText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    fontFamily: "monospace",
    padding: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  addQuestionnaireButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 12,
  },
  addQuestionnaireText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
