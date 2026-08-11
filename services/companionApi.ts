export interface CompanionThread {
  threadKey: string;
  createdAt: number;
}

export type CompanionPageSnapshot = Record<string, unknown>;

export interface CompanionApi {
  connect: () => Promise<void>;
  isReady: () => boolean;
  getOrCreateThread: (threadKey: string) => Promise<CompanionThread>;
}

const MOCK_CONNECT_DELAY_MS = 10000;
const MOCK_THREAD_DELAY_MS = 300;

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
  const newThread: CompanionThread = { threadKey, createdAt: Date.now() };
  mockThreads.set(threadKey, newThread);
  console.log(`[Companion] thread created for "${threadKey}"`);
  return newThread;
}

const mockCompanionApi: CompanionApi = {
  connect: mockConnect,
  isReady: mockIsReady,
  getOrCreateThread: mockGetOrCreateThread,
};

export const getCompanionApi = (): CompanionApi => {
  return mockCompanionApi;
};
