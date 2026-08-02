import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { AIDaySummaryTable, TimeMemoryTable } from "@/services/database";
import {
  activateModel,
  deactivateModel,
  generateDaySummary,
  isModelActive,
  isModelDownloaded,
  TEXT_MODEL_PROFILE,
} from "@/services/llmService";

const DAY_SUMMARY_PLACEHOLDER = "Summary TBD";

class NoEntriesError extends Error {
  constructor() {
    super("No entries yet to summarize");
    this.name = "NoEntriesError";
  }
}

class ModelNotDownloadedError extends Error {
  constructor() {
    super("Text model files are not downloaded yet");
    this.name = "ModelNotDownloadedError";
  }
}

// Checks the model is downloaded (throws a typed error if not) and loads it if needed.
async function ensureModelReady(): Promise<void> {
  const isDownloaded = await isModelDownloaded(TEXT_MODEL_PROFILE);
  if (!isDownloaded) {
    throw new ModelNotDownloadedError();
  }
  if (!isModelActive(TEXT_MODEL_PROFILE)) {
    await activateModel(TEXT_MODEL_PROFILE);
  }
}

// Gathers the day's time entries, runs the model, and logs the result to AIDaySummary.
async function generateAndSaveDaySummary(
  dayMemoryId: number,
  currentSummary: string,
): Promise<string> {
  const timeMemories =
    TimeMemoryTable.getTimeMemoriesByDayMemoryId(dayMemoryId);
  if (timeMemories.length === 0) {
    throw new NoEntriesError();
  }

  await ensureModelReady();

  const entries = timeMemories.map((tm) => {
    const entry = { timeOfRecord: tm.timeOfRecord, summary: tm.summary };
    return entry;
  });
  const existingSummary =
    currentSummary !== DAY_SUMMARY_PLACEHOLDER ? currentSummary : null;

  const generatedSummary = await generateDaySummary(entries, existingSummary);
  AIDaySummaryTable.createAIDaySummary(dayMemoryId, generatedSummary);
  return generatedSummary;
}

// Drives the AI-generate flow for SummaryCard's AI icon: loading state plus
// one user-facing alert per known failure mode (empty day, model not
// downloaded, or any other unexpected error).
export function useAIDaySummary() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = useCallback(
    async (
      dayMemoryId: number,
      currentSummary: string,
    ): Promise<string | null> => {
      setIsGenerating(true);
      try {
        const generatedSummary = await generateAndSaveDaySummary(
          dayMemoryId,
          currentSummary,
        );
        return generatedSummary;
      } catch (error) {
        if (error instanceof NoEntriesError) {
          Alert.alert(
            "No Entries Yet",
            "There's nothing recorded for this day to summarize.",
          );
        } else if (error instanceof ModelNotDownloadedError) {
          Alert.alert(
            "Model Not Ready",
            'The text model isn\'t downloaded yet. Go to Profile Settings > Debug LLM, pick "Gemma 3 (Text)", and download it.',
          );
        } else {
          console.error("AI day summary generation failed:", error);
          Alert.alert(
            "Error",
            "Something went wrong generating the summary. Please try again.",
          );
        }
        return null;
      } finally {
        await deactivateModel();
        setIsGenerating(false);
      }
    },
    [],
  );

  return { isGenerating, generateSummary };
}
