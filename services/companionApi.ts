export interface CompanionThread {
  threadKey: string;
  createdAt: number;
  messages: CompanionMessage[];
}

export type CompanionPageSnapshot = Record<string, unknown>;

export type CompanionMood = "neutral" | "positive" | "sad" | "snarky";

export interface CompanionMessage {
  role: "companion" | "user";
  mood: CompanionMood;
  text: string;
  createdAt: number;
}

export interface CompanionApi {
  connect: () => Promise<void>;
  isReady: () => boolean;
  getOrCreateThread: (threadKey: string) => Promise<CompanionThread>;
  generateRemark: (
    threadKey: string,
    pageState: CompanionPageSnapshot,
  ) => Promise<CompanionMessage>;
  sendUserMessage: (
    threadKey: string,
    text: string,
  ) => Promise<CompanionMessage>;
  peekThread: (threadKey: string) => CompanionThread | null;
  listThreads: () => Promise<CompanionThread[]>;
}

const MOCK_CONNECT_DELAY_MS = 3000;
const MOCK_THREAD_DELAY_MS = 300;
const MOCK_REMARK_DELAY_MS = 300;

function delay(milliseconds: number): Promise<void> {
  const delayPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
  return delayPromise;
}

let mockIsConnected = false;

async function mockConnect(): Promise<void> {
  await delay(MOCK_CONNECT_DELAY_MS);
  mockIsConnected = true;
}

function mockIsReady(): boolean {
  return mockIsConnected;
}

const mockThreads = new Map<string, CompanionThread>();

async function mockGetOrCreateThread(
  threadKey: string,
): Promise<CompanionThread> {
  await delay(MOCK_THREAD_DELAY_MS);
  const existingThread = mockThreads.get(threadKey);
  if (existingThread) {
    console.log(`[Companion] thread reused for "${threadKey}"`);
    return existingThread;
  }
  const newThread: CompanionThread = {
    threadKey,
    createdAt: Date.now(),
    messages: [],
  };
  mockThreads.set(threadKey, newThread);
  console.log(`[Companion] thread created for "${threadKey}"`);
  return newThread;
}

interface CannedRemark {
  mood: CompanionMood;
  text: string;
}

const CANNED_REMARKS: CannedRemark[] = [
  { mood: "positive", text: "Nice, this is looking good." },
  { mood: "neutral", text: "Noted — I see what's here now." },
  { mood: "snarky", text: "Oh, that's... a choice." },
  { mood: "sad", text: "Hm, quieter than I'd expect." },
];

let mockRemarkIndex = 0;

function pickCannedRemark(): CannedRemark {
  const cannedRemark = CANNED_REMARKS[mockRemarkIndex % CANNED_REMARKS.length];
  mockRemarkIndex += 1;
  return cannedRemark;
}

async function mockGenerateRemark(
  threadKey: string,
  pageState: CompanionPageSnapshot,
): Promise<CompanionMessage> {
  await delay(MOCK_REMARK_DELAY_MS);
  const thread = await mockGetOrCreateThread(threadKey);
  const cannedRemark = pickCannedRemark();
  const message: CompanionMessage = {
    role: "companion",
    mood: cannedRemark.mood,
    text: cannedRemark.text,
    createdAt: Date.now(),
  };
  const updatedThread: CompanionThread = {
    ...thread,
    messages: [...thread.messages, message],
  };
  mockThreads.set(threadKey, updatedThread);
  console.log("[Companion:remark]", threadKey, pageState, message);
  return message;
}

async function mockSendUserMessage(
  threadKey: string,
  text: string,
): Promise<CompanionMessage> {
  const thread = await mockGetOrCreateThread(threadKey);
  const message: CompanionMessage = {
    role: "user",
    mood: "neutral",
    text,
    createdAt: Date.now(),
  };
  const updatedThread: CompanionThread = {
    ...thread,
    messages: [...thread.messages, message],
  };
  mockThreads.set(threadKey, updatedThread);
  console.log("[Companion:userMessage]", threadKey, message);
  return message;
}

function mockPeekThread(threadKey: string): CompanionThread | null {
  const thread = mockThreads.get(threadKey) ?? null;
  return thread;
}

function getThreadLastActivity(thread: CompanionThread): number {
  const lastMessage = thread.messages[thread.messages.length - 1];
  const lastActivity = lastMessage ? lastMessage.createdAt : thread.createdAt;
  return lastActivity;
}

async function mockListThreads(): Promise<CompanionThread[]> {
  const threads = Array.from(mockThreads.values());
  console.log("[Companion:listThreads]", threads);
  const sortedThreads = [...threads].sort(
    (a, b) => getThreadLastActivity(b) - getThreadLastActivity(a),
  );
  return sortedThreads;
}

const mockCompanionApi: CompanionApi = {
  connect: mockConnect,
  isReady: mockIsReady,
  getOrCreateThread: mockGetOrCreateThread,
  generateRemark: mockGenerateRemark,
  sendUserMessage: mockSendUserMessage,
  peekThread: mockPeekThread,
  listThreads: mockListThreads,
};

export const getCompanionApi = (): CompanionApi => {
  return mockCompanionApi;
};
