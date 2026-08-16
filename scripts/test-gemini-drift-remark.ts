import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const COMPANION_VOICE_INSTRUCTION = `You are a witty, opinionated companion inside a journaling app, reacting to the user's page. Give a genuine reaction in 1-2 short sentences, in character — not a neutral status report. React from the "ideal self" persona given to you: if today's page state matches it, be warmly positive; if it's a real gap from that persona, say so with real personality, referencing what's different from their usual pattern.`;

const BASELINE_PERSONA = `The user's ideal self is active and health-conscious, maintaining a high daily step count and enjoying outdoor activities like hikes with friends. They also engage deeply with their personal life by reading, spending time with others, and thoughtfully processing stressful work days through long, reflective journaling. Currently, the user is successfully embodying this vibrant, active, and reflective baseline.`;

interface DriftScenario {
  label: string;
  pageState: string;
}

interface DriftResult {
  scenario: DriftScenario;
  remark: string;
}

const DRIFT_SCENARIOS: DriftScenario[] = [
  {
    label: "Aligned",
    pageState:
      "Day Summary page: logged a 6-mile trail run this morning, wrote a detailed, reflective journal entry about it, 9,500 steps today.",
  },
  {
    label: "Drifted",
    pageState:
      'Day Summary page: no walk logged today, the third day in a row, one-line journal entry: "meh", no photo added.',
  },
];

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY before running this script.");
  }
  return apiKey;
}

function buildRemarkUserContent(persona: string, pageState: string): string {
  const userContent = `Ideal self: "${persona}"\n\nCurrent page state: ${pageState}`;
  return userContent;
}

async function generateRemark(
  ai: GoogleGenAI,
  persona: string,
  pageState: string,
): Promise<string> {
  const userContent = buildRemarkUserContent(persona, pageState);
  const userPart = { text: userContent };
  const userMessage = { role: "user" as const, parts: [userPart] };
  const generationConfig = {
    systemInstruction: COMPANION_VOICE_INSTRUCTION,
    temperature: 0,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
  };
  const generateContentRequest = {
    model: GEMINI_MODEL,
    contents: [userMessage],
    config: generationConfig,
  };
  const response = await ai.models.generateContent(generateContentRequest);
  const trimmedText = response.text?.trim() ?? "";
  return trimmedText;
}

function formatDriftReport(results: DriftResult[]): string {
  const sections = results.map((result) => {
    const section =
      `${result.scenario.label}\n` +
      `   Page state: ${result.scenario.pageState}\n` +
      `   Remark: ${result.remark}`;
    return section;
  });
  const report = sections.join("\n\n");
  return report;
}

async function runDriftTest(ai: GoogleGenAI): Promise<DriftResult[]> {
  const results: DriftResult[] = [];
  for (const scenario of DRIFT_SCENARIOS) {
    const remark = await generateRemark(
      ai,
      BASELINE_PERSONA,
      scenario.pageState,
    );
    const result: DriftResult = { scenario, remark };
    results.push(result);
  }
  return results;
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const clientConfig = { apiKey };
  const ai = new GoogleGenAI(clientConfig);
  const results = await runDriftTest(ai);
  const report = formatDriftReport(results);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
