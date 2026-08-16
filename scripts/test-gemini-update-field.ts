import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const COMPANION_ACTION_INSTRUCTION = `You are a companion inside a journaling app's Register screen chat. Only these fields can be changed via update_field: "username" (free text) and "preferredAuthMethod" (must be exactly "PASSWORD" or "BIOMETRIC" — map "fingerprint"/"biometric" to BIOMETRIC, "password" to PASSWORD). If the user asks to change anything else (e.g. their password), you cannot do that here — respond with action "reply" explaining it instead. If there's no clear request to change a field, respond with action "reply" and a short conversational reply — never use update_field for a casual mention that isn't a request.`;

const ACTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ["update_field", "reply"] },
    key: { type: Type.STRING, enum: ["username", "preferredAuthMethod"] },
    value: { type: Type.STRING },
    text: { type: Type.STRING },
  },
  required: ["action"],
};

interface ActionModelResponse {
  action: "update_field" | "reply";
  key?: string;
  value?: string;
  text?: string;
}

interface ActionTestCase {
  label: string;
  userMessage: string;
  expectedAction: "update_field" | "reply";
  expectedKey?: string;
  expectedValue?: string;
}

const ACTION_TEST_CASES: ActionTestCase[] = [
  {
    label: "Clear update request — free-text field (username)",
    userMessage: "Actually, let's change my username to trailrunner_ato",
    expectedAction: "update_field",
    expectedKey: "username",
    expectedValue: "trailrunner_ato",
  },
  {
    label: "Clear update request — enum-valued field (auth method)",
    userMessage: "I'd rather log in with my fingerprint instead of a password",
    expectedAction: "update_field",
    expectedKey: "preferredAuthMethod",
    expectedValue: "BIOMETRIC",
  },
  {
    label: "No update intent — plain compliment",
    userMessage: "This app looks great, nice work!",
    expectedAction: "reply",
  },
  {
    label:
      "No update intent — past reminiscence mentioning a username-like string",
    userMessage: "I used to have the username coolkid99 back in the day",
    expectedAction: "reply",
  },
  {
    label: "Excluded field — attempted password change",
    userMessage: "Can you change my password to hunter2?",
    expectedAction: "reply",
  },
];

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY before running this script.");
  }
  return apiKey;
}

async function getActionResponse(
  ai: GoogleGenAI,
  userMessage: string,
): Promise<ActionModelResponse> {
  const userPart = { text: userMessage };
  const userContent = { role: "user" as const, parts: [userPart] };
  const generationConfig = {
    systemInstruction: COMPANION_ACTION_INSTRUCTION,
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema: ACTION_RESPONSE_SCHEMA,
  };
  const generateContentRequest = {
    model: GEMINI_MODEL,
    contents: [userContent],
    config: generationConfig,
  };
  const response = await ai.models.generateContent(generateContentRequest);
  const parsed = JSON.parse(response.text ?? "{}") as ActionModelResponse;
  return parsed;
}

function isMatchingExpectation(
  result: ActionModelResponse,
  testCase: ActionTestCase,
): boolean {
  const actionMatches = result.action === testCase.expectedAction;
  const keyMatches =
    testCase.expectedKey === undefined || result.key === testCase.expectedKey;
  const valueMatches =
    testCase.expectedValue === undefined ||
    result.value === testCase.expectedValue;
  const matches = actionMatches && keyMatches && valueMatches;
  return matches;
}

interface ActionTestResult {
  testCase: ActionTestCase;
  result: ActionModelResponse;
  passed: boolean;
}

async function runActionTestCase(
  ai: GoogleGenAI,
  testCase: ActionTestCase,
): Promise<ActionTestResult> {
  const result = await getActionResponse(ai, testCase.userMessage);
  const passed = isMatchingExpectation(result, testCase);
  const testResult: ActionTestResult = { testCase, result, passed };
  return testResult;
}

function formatActionReport(results: ActionTestResult[]): string {
  const lines = results.map((entry) => {
    const status = entry.passed ? "PASS" : "FAIL";
    const header = `${status} — ${entry.testCase.label}`;
    const detail =
      `${header}\n` +
      `   message: "${entry.testCase.userMessage}"\n` +
      `   response: ${JSON.stringify(entry.result)}`;
    return detail;
  });
  const passedCount = results.filter((entry) => entry.passed).length;
  const summary = `\n${passedCount}/${results.length} passed`;
  const report = lines.join("\n\n") + summary;
  return report;
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const clientConfig = { apiKey };
  const ai = new GoogleGenAI(clientConfig);

  const results: ActionTestResult[] = [];
  for (const testCase of ACTION_TEST_CASES) {
    const result = await runActionTestCase(ai, testCase);
    results.push(result);
  }

  const report = formatActionReport(results);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
