import { agentControllerMessageText, MastraClient } from "@mastra/client-js";
import { z } from "zod";
import type { MastraDBMessage } from "@mastra/client-js";
import type {
  CompanionMessage,
  CompanionMood,
  CompanionPageSnapshot,
  CompanionThread,
} from "@/services/companionApi";
import { logInfo } from "@/services/appLogger";
import { PageThreadTable, UserTable } from "@/services/database";

const MASTRA_BASE_URL = process.env.EXPO_PUBLIC_AI_END_POINT ?? "";
const COMPANION_AGENT_ID = "agent";
const CONNECT_TIMEOUT_MS = 15000;

let isCompanionConnected = false;

// Hermes doesn't implement AbortSignal.timeout(), so build the signal by hand.
function createTimeoutSignal(milliseconds: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, milliseconds);
  return controller.signal;
}

// Fresh client per attempt so each one gets its own deadline via abortSignal.
function createMastraClient(): MastraClient {
  const timeoutSignal = createTimeoutSignal(CONNECT_TIMEOUT_MS);
  const mastraClientConfig = {
    baseUrl: MASTRA_BASE_URL,
    abortSignal: timeoutSignal,
  };
  const client = new MastraClient(mastraClientConfig);
  return client;
}

// Confirms the companion agent is reachable and registered on the backend.
export async function realConnect(): Promise<void> {
  const mastraClient = createMastraClient();
  await mastraClient.getAgent(COMPANION_AGENT_ID).details();
  isCompanionConnected = true;
}

export function isCompanionReady(): boolean {
  return isCompanionConnected;
}

const REMARK_MOODS = ["neutral", "positive", "sad", "snarky"] as const;

const remarkOutputSchema = z.object({
  mood: z.enum(REMARK_MOODS),
  text: z.string().max(100),
});

type RemarkOutput = z.infer<typeof remarkOutputSchema>;

interface ResolvedMastraThread {
  threadId: string;
  createdAt: number;
  isNew: boolean;
}

// Resolves (or creates) the Mastra thread id for a page. The local PageThread
// table is the source of truth for "does this page already have a thread" —
// a hit there is a pure local read, no network call.
async function resolveMastraThreadId(
  userId: number,
  threadKey: string,
  resourceId: string,
): Promise<ResolvedMastraThread> {
  const existingPageThread = PageThreadTable.getPageThread(userId, threadKey);
  if (existingPageThread) {
    return {
      threadId: existingPageThread.threadId,
      createdAt: new Date(existingPageThread.createdAt).getTime(),
      isNew: false,
    };
  }

  const mastraClient = createMastraClient();
  const createdThread = await mastraClient.createMemoryThread({
    resourceId,
    agentId: COMPANION_AGENT_ID,
  });
  const newPageThread = {
    userId,
    resourceId,
    threadId: createdThread.id,
    pageName: threadKey,
  };
  PageThreadTable.createPageThread(newPageThread);
  return { threadId: createdThread.id, createdAt: Date.now(), isNew: true };
}

function mapDbMessageToCompanionMessage(
  dbMessage: MastraDBMessage,
): CompanionMessage | null {
  if (dbMessage.role !== "user" && dbMessage.role !== "assistant") {
    return null;
  }
  const role: CompanionMessage["role"] =
    dbMessage.role === "user" ? "user" : "companion";
  return {
    role,
    mood: "neutral",
    text: agentControllerMessageText(dbMessage),
    createdAt: new Date(dbMessage.createdAt).getTime(),
  };
}

const RECENT_MESSAGE_LIMIT = 50;

// Reads a thread's persisted message history (capability 6 — a plain read,
// does not trigger generation). Fetches the most recent messages (descending,
// capped) then reverses to chronological order — sorting ascending with no
// cap would silently drop the newest messages once a thread outgrows the
// server's default page size.
async function fetchThreadMessages(
  threadId: string,
): Promise<CompanionMessage[]> {
  const mastraClient = createMastraClient();
  const { messages } = await mastraClient
    .getMemoryThread({ threadId, agentId: COMPANION_AGENT_ID })
    .listMessages({
      orderBy: { field: "createdAt", direction: "DESC" },
      perPage: RECENT_MESSAGE_LIMIT,
    });
  const companionMessages = messages
    .map(mapDbMessageToCompanionMessage)
    .filter((message): message is CompanionMessage => message !== null)
    .reverse();
  return companionMessages;
}

export async function realGetOrCreateThread(
  threadKey: string,
  resourceId: string,
): Promise<CompanionThread> {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    throw new Error(
      "Cannot resolve a companion thread with no registered user.",
    );
  }

  const resolved = await resolveMastraThreadId(userId, threadKey, resourceId);
  const messages = resolved.isNew
    ? []
    : await fetchThreadMessages(resolved.threadId);
  const thread: CompanionThread = {
    threadKey,
    createdAt: resolved.createdAt,
    messages,
  };
  return thread;
}

// Sends a page snapshot to the agent and returns its short in-character reaction.
export async function realGenerateRemark(
  threadKey: string,
  pageState: CompanionPageSnapshot,
  resourceId: string,
): Promise<CompanionMessage> {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    throw new Error(
      "Cannot generate a companion remark with no registered user.",
    );
  }

  const resolved = await resolveMastraThreadId(userId, threadKey, resourceId);
  const mastraClient = createMastraClient();
  const prompt = `Current page state (${threadKey}):\n${JSON.stringify(pageState)}`;
  const response = await mastraClient
    .getAgent(COMPANION_AGENT_ID)
    .generate<RemarkOutput>(prompt, {
      memory: { thread: resolved.threadId, resource: resourceId },
      structuredOutput: { schema: remarkOutputSchema },
      activeTools: [],
    });

  const message: CompanionMessage = {
    role: "companion",
    mood: response.object.mood as CompanionMood,
    text: response.object.text,
    createdAt: Date.now(),
  };
  return message;
}

// Sends the user's typed message to the agent and returns its reply.
export async function realSendUserMessage(
  threadKey: string,
  text: string,
  resourceId: string,
): Promise<CompanionMessage> {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    throw new Error("Cannot send a companion message with no registered user.");
  }

  const resolved = await resolveMastraThreadId(userId, threadKey, resourceId);
  logInfo("[Companion:realSendUserMessage] resolved thread", resolved);
  const mastraClient = createMastraClient();
  const response = await mastraClient
    .getAgent(COMPANION_AGENT_ID)
    .generate<RemarkOutput>(text, {
      memory: { thread: resolved.threadId, resource: resourceId },
      structuredOutput: { schema: remarkOutputSchema },
      activeTools: [],
    });
  logInfo("[Companion:realSendUserMessage] agent responded", response.object);

  const message: CompanionMessage = {
    role: "companion",
    mood: response.object.mood as CompanionMood,
    text: response.object.text,
    createdAt: Date.now(),
  };
  return message;
}

// Lists every page thread for the current user, newest first. Pure local
// read — PageThread is already the authoritative index (kept in sync by
// resolveMastraThreadId), no Mastra API call needed.
export function realListThreads(): Promise<CompanionThread[]> {
  const userId = UserTable.getRegisteredUserId();
  if (!userId) {
    return Promise.resolve([]);
  }

  const pageThreads = PageThreadTable.getPageThreadsForUser(userId);
  const threads: CompanionThread[] = pageThreads.map((pageThread) => ({
    threadKey: pageThread.pageName,
    createdAt: new Date(pageThread.createdAt).getTime(),
    messages: [],
  }));
  return Promise.resolve(threads);
}
