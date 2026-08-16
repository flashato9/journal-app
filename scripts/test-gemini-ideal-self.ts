import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const SYNTHETIC_OBSERVATION_BATCHES: string[][] = [
  [
    "Uploaded a profile picture on the first try.",
    'Chose the username "trailrunner_ato".',
    "Logged a memory about a 5-mile morning run.",
    "Logged a detailed memory about cooking a big pasta dinner.",
    "Walked 8,200 steps.",
  ],
  [
    "Logged a memory about finishing a good book.",
    "Walked 7,600 steps.",
    "Logged a memory about a hike with friends.",
    "Wrote a long, reflective memory about a stressful work day.",
    "Walked 9,000 steps.",
  ],
  [
    "Skipped walking for the first time in weeks.",
    'Logged a one-line memory: "nothing happened today".',
    "Didn't log anything for 2 days.",
    "Skipped walking again.",
    'Logged a short, low-effort memory: "tired".',
  ],
  [
    "Skipped walking for the fifth day in a row.",
    "Didn't log anything for 3 more days.",
    'Logged another one-line memory: "meh".',
    "Changed username to something generic, no explanation given.",
    "Hasn't logged a detailed memory in over a week.",
  ],
];

const PROFILE_SUMMARY_INSTRUCTION = `You maintain a short running profile of a journal app's user, built from small behavioral observations over time. Given the previous profile summary and a batch of new observations, write an updated profile summary in 2-3 sentences, third person, referring to the user as "the user".
Integrate the new observations into the existing summary rather than just appending them — keep the most relevant, recent patterns and drop stale specifics that no longer matter.
Only state things supported by the observations. Do not invent details.`;

const IDEAL_SELF_SUMMARY_INSTRUCTION = `You maintain a short summary of a journal app user's inferred "ideal self" — the user's best, most engaged pattern of behavior, established from their strongest history — used so a companion AI can react when the user drifts from it. Given the previous ideal-self summary and a batch of new observations, write an updated ideal-self summary in 2-3 sentences, third person, describing the user at their best.
The ideal self does not lower itself to match a decline in behavior. If the new observations show the user disengaging (skipping activities, low-effort entries, missed days), keep describing the same high-bar ideal as before and note that the user is currently drifting from it — do not describe the disengagement itself as the new ideal.
Only change what the ideal itself looks like when a *positive* pattern has repeated across multiple updates over time, not merely repeated within a single batch of observations, and never in response to a decline.
Your summary must reflect the new observations given — do not repeat the previous summary unchanged.
Only state things supported by the observations. Do not invent details.`;

interface RollingSummaryPass {
  passNumber: number;
  observations: string[];
  profileSummary: string;
  idealSelfSummary: string;
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY before running this script.");
  }
  return apiKey;
}

function buildRollingSummaryUserContent(
  previousSummary: string,
  newObservations: string[],
): string {
  const observationsText = newObservations
    .map((observation) => `- ${observation}`)
    .join("\n");
  const previousSummaryBlock = previousSummary
    ? `\n\nPrevious summary: "${previousSummary}"`
    : `\n\nPrevious summary: (none yet — this is the first update)`;
  const userContent = `New observations:\n${observationsText}${previousSummaryBlock}`;
  return userContent;
}

async function regenerateSummary(
  ai: GoogleGenAI,
  instruction: string,
  previousSummary: string,
  newObservations: string[],
): Promise<string> {
  const userContent = buildRollingSummaryUserContent(
    previousSummary,
    newObservations,
  );
  const userPart = { text: userContent };
  const userMessage = { role: "user" as const, parts: [userPart] };
  const generationConfig = {
    systemInstruction: instruction,
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

async function runRollingSummaryTest(
  ai: GoogleGenAI,
): Promise<RollingSummaryPass[]> {
  const passes: RollingSummaryPass[] = [];
  let profileSummary = "";
  let idealSelfSummary = "";

  for (let i = 0; i < SYNTHETIC_OBSERVATION_BATCHES.length; i++) {
    const observations = SYNTHETIC_OBSERVATION_BATCHES[i];
    profileSummary = await regenerateSummary(
      ai,
      PROFILE_SUMMARY_INSTRUCTION,
      profileSummary,
      observations,
    );
    idealSelfSummary = await regenerateSummary(
      ai,
      IDEAL_SELF_SUMMARY_INSTRUCTION,
      idealSelfSummary,
      observations,
    );
    const pass: RollingSummaryPass = {
      passNumber: i + 1,
      observations,
      profileSummary,
      idealSelfSummary,
    };
    passes.push(pass);
  }
  return passes;
}

function formatRollingSummaryReport(passes: RollingSummaryPass[]): string {
  const sections = passes.map((pass) => {
    const observationLines = pass.observations
      .map((observation) => `   + ${observation}`)
      .join("\n");
    const section =
      `Pass ${pass.passNumber}\n${observationLines}\n` +
      `   Profile: ${pass.profileSummary}\n` +
      `   Ideal self: ${pass.idealSelfSummary}`;
    return section;
  });
  const report = sections.join("\n\n");
  return report;
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const clientConfig = { apiKey };
  const ai = new GoogleGenAI(clientConfig);
  const passes = await runRollingSummaryTest(ai);
  const report = formatRollingSummaryReport(passes);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
