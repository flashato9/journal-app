import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
import Animated from "react-native-reanimated";
import { getColors } from "@/constants/colors";
import { useAITimeSummary } from "@/hooks/memories/useAITimeSummary";
import { useSpin } from "@/hooks/ui/useSpin";
import UploadMedia, {
  MediaItem,
} from "@/components/memories/MediaGallery/UploadMedia";
import QuestionnaireCard, {
  QuestionnaireItem,
} from "@/components/memories/QuestionnaireCard";

const colors = getColors();
const SUMMARY_MAX_LENGTH = 100;
const BLINK_INTERVAL_MS = 250;

export interface LocationInfo {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

export type LocationState = LocationInfo | null | "Loading" | "Unretrievable";

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
  onRetryLocation?: () => void;
  timeMemoryId: number | null;
}

function isLocationLoading(location: LocationState): boolean {
  const result = location === "Loading";
  return result;
}

function isLocationUnretrievable(location: LocationState): boolean {
  const result = location === "Unretrievable";
  return result;
}

function getLocationLabel(location: LocationState): string {
  if (location === "Loading") {
    const label = "Locating...";
    return label;
  }
  if (location === "Unretrievable") {
    const label = "Unretrievable";
    return label;
  }
  if (location === null) {
    const label = "Not available";
    return label;
  }
  const altitudeLabel =
    location.altitude !== null ? `${location.altitude.toFixed(1)}m` : "N/A";
  const label = `${location.longitude.toFixed(4)} / ${location.latitude.toFixed(4)} / ${altitudeLabel}`;
  return label;
}

export default function MemoryForm({
  storage,
  onStorageChange,
  onRetryLocation,
  timeMemoryId,
}: MemoryFormProps) {
  const [isSummaryFocused, setIsSummaryFocused] = useState(false);
  const { isGenerating: isGeneratingSummary, generateSummary } =
    useAITimeSummary();
  const { spinStyle } = useSpin(isGeneratingSummary);

  const handleSummaryChange = (newSummary: string) => {
    const nextStorage = { ...storage, summary: newSummary };
    onStorageChange(nextStorage);
  };

  // Generates a summary from answered questions + the current draft, then fills the box.
  const handleGenerateSummary = async () => {
    const inputs = {
      questionnaire: storage.questionnaire,
      summary: storage.summary,
    };
    console.log("handleGenerateSummary inputs:", inputs);
    const generatedSummary = await generateSummary(
      timeMemoryId,
      storage.questionnaire,
      storage.summary,
    );
    console.log("handleGenerateSummary output:", generatedSummary);
    if (generatedSummary !== null) {
      handleSummaryChange(generatedSummary);
    }
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

  const locationLabel = getLocationLabel(storage.location);
  const locationIsLoading = isLocationLoading(storage.location);
  const locationIsUnretrievable = isLocationUnretrievable(storage.location);

  const [isLocationBlinkVisible, setIsLocationBlinkVisible] = useState(true);

  useEffect(() => {
    if (!locationIsLoading) {
      setIsLocationBlinkVisible(true);
      return;
    }
    const intervalId = setInterval(() => {
      setIsLocationBlinkVisible((prev) => !prev);
    }, BLINK_INTERVAL_MS);
    const cleanup = () => clearInterval(intervalId);
    return cleanup;
  }, [locationIsLoading]);

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <TextInput
              style={[
                styles.summaryInput,
                !storage.isEditable && styles.inputReadOnly,
                isSummaryFocused && styles.inputFocused,
              ]}
              placeholder="write about your day..."
              placeholderTextColor={colors.createMemorySubtitleColor}
              value={storage.summary}
              onChangeText={
                storage.isEditable ? handleSummaryChange : undefined
              }
              onFocus={() => setIsSummaryFocused(true)}
              onBlur={() => setIsSummaryFocused(false)}
              editable={storage.isEditable}
              multiline
              numberOfLines={4}
              maxLength={SUMMARY_MAX_LENGTH}
            />
            {storage.isEditable && (
              <TouchableOpacity
                onPress={handleGenerateSummary}
                disabled={isGeneratingSummary}
                style={styles.aiButton}
              >
                {isGeneratingSummary ? (
                  <Animated.View style={spinStyle}>
                    <MaterialCommunityIcons
                      name="loading"
                      size={22}
                      color={colors.createMemoryTitleColor}
                    />
                  </Animated.View>
                ) : (
                  <MaterialCommunityIcons
                    name="robot-excited-outline"
                    size={22}
                    color={colors.createMemoryTitleColor}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.charCounter}>
            {storage.summary.length} / {SUMMARY_MAX_LENGTH} characters
          </Text>

          <View style={styles.locationRow}>
            {locationIsLoading ? (
              <MaterialIcons
                name="place"
                size={16}
                color={colors.createMemorySubtitleColor}
                style={
                  isLocationBlinkVisible
                    ? styles.locationBlinkVisible
                    : styles.locationBlinkHidden
                }
              />
            ) : (
              <MaterialIcons
                name="place"
                size={16}
                color={
                  locationIsUnretrievable
                    ? colors.createMemoryLocationErrorText
                    : colors.createMemorySubtitleColor
                }
              />
            )}
            <Text
              style={[
                styles.detailText,
                locationIsUnretrievable && styles.detailTextError,
                locationIsLoading &&
                  (isLocationBlinkVisible
                    ? styles.locationBlinkVisible
                    : styles.locationBlinkHidden),
              ]}
            >
              GPS Location: {locationLabel}
            </Text>
            {!locationIsLoading && onRetryLocation && (
              <TouchableOpacity
                onPress={onRetryLocation}
                style={[
                  styles.retryButton,
                  locationIsUnretrievable && styles.retryButtonError,
                ]}
                activeOpacity={0.6}
              >
                <MaterialIcons
                  name="refresh"
                  size={16}
                  color={
                    locationIsUnretrievable
                      ? colors.createMemoryLocationErrorText
                      : colors.createMemorySubtitleColor
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Media Gallery</Text>
          <UploadMedia
            media={storage.media}
            onMediaSelected={
              storage.isEditable ? handleMediaSelected : () => {}
            }
            isEditable={storage.isEditable}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Questionnaire</Text>
          <View style={styles.questionnaireList}>
            {storage.questionnaire.length === 0 ? (
              <Text style={styles.emptyText}>No questionnaires</Text>
            ) : (
              storage.questionnaire.map((item, index) => {
                const questionnaireCard = (
                  <QuestionnaireCard
                    key={item.id}
                    item={item}
                    index={index + 1}
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
                );
                return questionnaireCard;
              })
            )}
          </View>
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.createMemoryCardBackground,
    borderWidth: 1,
    borderColor: colors.createMemoryCardBorder,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.createMemoryTitleColor,
  },
  summaryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.createMemoryCardBorder,
    borderRadius: 12,
    backgroundColor: colors.createMemoryInputBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },
  aiButton: {
    padding: 4,
  },
  inputReadOnly: {
    borderColor: colors.createMemoryCardBorder,
    backgroundColor: colors.createMemoryCardBackground,
  },
  inputFocused: {
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.25)",
  },
  charCounter: {
    fontSize: 12,
    color: colors.createMemorySubtitleColor,
    marginTop: 6,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.createMemorySubtitleColor,
    fontWeight: "500",
  },
  detailTextError: {
    color: colors.createMemoryLocationErrorText,
  },
  locationBlinkVisible: {
    opacity: 1,
  },
  locationBlinkHidden: {
    opacity: 0,
  },
  retryButton: {
    padding: 2,
  },
  retryButtonError: {
    backgroundColor: colors.createMemoryLocationErrorBackground,
    borderWidth: 1,
    borderColor: colors.createMemoryLocationErrorBorder,
    borderRadius: 11,
  },
  questionnaireList: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.createMemorySubtitleColor,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  addQuestionnaireButton: {
    backgroundColor: colors.dayMemoriesDateChipBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 12,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  addQuestionnaireText: {
    color: colors.dayMemoriesDateChipText,
    fontSize: 14,
    fontWeight: "600",
  },
});
