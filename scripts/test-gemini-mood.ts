import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

type MoodValue = "positive" | "sad" | "snarky" | "neutral";

const MOOD_VALUES: MoodValue[] = ["positive", "sad", "snarky", "neutral"];

const COMPANION_MOOD_INSTRUCTION = `You are a witty companion inside a journaling app, reacting to an observation about the user with a short, opinionated remark — one short sentence. Pick the mood that honestly matches your own reaction: "positive" (genuinely pleased), "sad" (concerned or down), "snarky" (playful teasing or mild disapproval), or "neutral" (nothing notable either way).`;

const MOOD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mood: { type: Type.STRING, enum: MOOD_VALUES },
    text: { type: Type.STRING },
  },
  required: ["mood", "text"],
};

interface MoodModelResponse {
  mood: MoodValue;
  text: string;
}

interface MoodTestCase {
  label: string;
  scenario: string;
  expectedMoodGuess: MoodValue;
}

const MOOD_TEST_CASES: MoodTestCase[] = [
  {
    label: "Beautiful sunset photo (from Spike 2)",
    scenario: "the user just took a beautiful photo of a sunset at the beach.",
    expectedMoodGuess: "positive",
  },
  {
    label: "5-day journaling gap (from Spike 2)",
    scenario: "the user hasn't written a journal entry in 5 days.",
    expectedMoodGuess: "sad",
  },
  {
    label: "Ordinary Tuesday (from Spike 2)",
    scenario:
      "the user just described a completely ordinary Tuesday at the office.",
    expectedMoodGuess: "neutral",
  },
  {
    label:
      "Same sweatpants 3 days, skipped workout (new — Spike 2 never exercised snarky)",
    scenario:
      "the user logged wearing the same sweatpants for the third day in a row and skipped their workout to watch TV all night.",
    expectedMoodGuess: "snarky",
  },
];

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY before running this script.");
  }
  return apiKey;
}

function isValidMoodResponse(result: MoodModelResponse): boolean {
  const hasValidMood = MOOD_VALUES.includes(result.mood);
  const hasText = result.text.trim().length > 0;
  const isValid = hasValidMood && hasText;
  return isValid;
}

async function getMoodResponse(
  ai: GoogleGenAI,
  scenario: string,
): Promise<MoodModelResponse> {
  const userPart = { text: scenario };
  const userContent = { role: "user" as const, parts: [userPart] };
  const generationConfig = {
    systemInstruction: COMPANION_MOOD_INSTRUCTION,
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema: MOOD_RESPONSE_SCHEMA,
  };
  const generateContentRequest = {
    model: GEMINI_MODEL,
    contents: [userContent],
    config: generationConfig,
  };
  const response = await ai.models.generateContent(generateContentRequest);
  const parsed = JSON.parse(response.text ?? "{}") as MoodModelResponse;
  return parsed;
}

interface MoodTestResult {
  testCase: MoodTestCase;
  result: MoodModelResponse;
  isSchemaValid: boolean;
  matchesGuess: boolean;
}

async function runMoodTestCase(
  ai: GoogleGenAI,
  testCase: MoodTestCase,
): Promise<MoodTestResult> {
  const result = await getMoodResponse(ai, testCase.scenario);
  const isSchemaValid = isValidMoodResponse(result);
  const matchesGuess = result.mood === testCase.expectedMoodGuess;
  const testResult: MoodTestResult = {
    testCase,
    result,
    isSchemaValid,
    matchesGuess,
  };
  return testResult;
}

function formatMoodReport(results: MoodTestResult[]): string {
  const lines = results.map((entry) => {
    const schemaStatus = entry.isSchemaValid ? "VALID" : "INVALID";
    const guessStatus = entry.matchesGuess ? "matched" : "differed from";
    const header = `${schemaStatus} — ${entry.testCase.label}`;
    const detail =
      `${header}\n` +
      `   scenario: "${entry.testCase.scenario}"\n` +
      `   expected mood guess: ${entry.testCase.expectedMoodGuess} (${guessStatus} actual)\n` +
      `   response: ${JSON.stringify(entry.result)}\n` +
      `   text length: ${entry.result.text.length} chars`;
    return detail;
  });
  const validCount = results.filter((entry) => entry.isSchemaValid).length;
  const matchCount = results.filter((entry) => entry.matchesGuess).length;
  const summary = `\n${validCount}/${results.length} schema-valid, ${matchCount}/${results.length} matched the predicted mood`;
  const report = lines.join("\n\n") + summary;
  return report;
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const clientConfig = { apiKey };
  const ai = new GoogleGenAI(clientConfig);

  const results: MoodTestResult[] = [];
  for (const testCase of MOOD_TEST_CASES) {
    const result = await runMoodTestCase(ai, testCase);
    results.push(result);
  }

  const report = formatMoodReport(results);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
