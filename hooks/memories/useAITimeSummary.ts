import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { logError } from "@/services/appLogger";
import { AITimeSummaryTable } from "@/services/database";
import {
  activateModel,
  deactivateModel,
  generateTimeSummary,
  isModelActive,
  isModelDownloaded,
  TEXT_MODEL_PROFILE,
  TimeSummaryQA,
} from "@/services/llmService";

class NoContentError extends Error {
  constructor() {
    super("Nothing to summarize yet");
    this.name = "NoContentError";
  }
}

class ModelNotDownloadedError extends Error {
  constructor() {
    super("Text model files are not downloaded yet");
    this.name = "ModelNotDownloadedError";
  }
}

async function ensureModelReady(): Promise<void> {
  const isDownloaded = await isModelDownloaded(TEXT_MODEL_PROFILE);
  if (!isDownloaded) {
    throw new ModelNotDownloadedError();
  }
  if (!isModelActive(TEXT_MODEL_PROFILE)) {
    await activateModel(TEXT_MODEL_PROFILE);
  }
}

// Filters to answered questions, runs the model, and logs to AITimeSummary if a timeMemoryId exists yet.
async function generateAndSaveTimeSummary(
  timeMemoryId: number | null,
  qaPairs: TimeSummaryQA[],
  currentSummary: string,
): Promise<string> {
  const answeredQA = qaPairs.filter((qa) => qa.answer.trim().length > 0);
  if (answeredQA.length === 0 && !currentSummary.trim()) {
    throw new NoContentError();
  }

  await ensureModelReady();

  const generatedSummary = await generateTimeSummary(
    answeredQA,
    currentSummary,
  );
  if (timeMemoryId !== null) {
    AITimeSummaryTable.createAITimeSummary(timeMemoryId, generatedSummary);
  }
  return generatedSummary;
}

// Drives the AI-generate flow for MemoryForm's AI icon: loading state plus
// one user-facing alert per known failure mode (nothing to summarize, model
// not downloaded, or any other unexpected error).
export function useAITimeSummary() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = useCallback(
    async (
      timeMemoryId: number | null,
      qaPairs: TimeSummaryQA[],
      currentSummary: string,
    ): Promise<string | null> => {
      setIsGenerating(true);
      try {
        const generatedSummary = await generateAndSaveTimeSummary(
          timeMemoryId,
          qaPairs,
          currentSummary,
        );
        return generatedSummary;
      } catch (error) {
        if (error instanceof NoContentError) {
          Alert.alert(
            "Nothing to Summarize",
            "Answer at least one question or write something in the summary first.",
          );
        } else if (error instanceof ModelNotDownloadedError) {
          Alert.alert(
            "Model Not Ready",
            'The text model isn\'t downloaded yet. Go to Profile Settings > Debug LLM, pick "Gemma 3 (Text)", and download it.',
          );
        } else {
          logError("AI time summary generation failed:", error);
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
