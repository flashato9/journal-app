import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CompanionMessage,
  CompanionThread,
  getCompanionApi,
} from "@/services/companionApi";
import { logError, logInfo, logTrace, logWarn } from "@/services/appLogger";
import { UserTable } from "@/services/database";

export type CompanionStatus = "connecting" | "ready" | "offline";

const POPUP_VISIBLE_DURATION_MS = 4000;
const CONNECT_MAX_ATTEMPTS = 3;
const CONNECT_BACKOFF_MS = [1000, 2000, 4000];

interface CompanionContextType {
  status: CompanionStatus;
  isChatOpen: boolean;
  setIsChatOpen: (isChatOpen: boolean) => void;
  latestMessage: CompanionMessage | null;
  showTransientMessage: (message: CompanionMessage) => void;
  reportCompanionMessage: (
    threadKey: string,
    message: CompanionMessage,
  ) => void;
  activeThread: CompanionThread | null;
  reportActiveThread: (thread: CompanionThread) => void;
  refreshActiveThread: (threadKey: string) => void;
  threadListVersion: number;
  bumpThreadListVersion: () => void;
  retryConnection: () => void;
}

function noopShowTransientMessage(): void {}
function noopReportCompanionMessage(): void {}
function noopSetIsChatOpen(): void {}
function noopReportActiveThread(): void {}
function noopRefreshActiveThread(): void {}
function noopBumpThreadListVersion(): void {}
function noopRetryConnection(): void {}

export const CompanionContext = createContext<CompanionContextType>({
  status: "connecting",
  isChatOpen: false,
  setIsChatOpen: noopSetIsChatOpen,
  latestMessage: null,
  showTransientMessage: noopShowTransientMessage,
  reportCompanionMessage: noopReportCompanionMessage,
  activeThread: null,
  reportActiveThread: noopReportActiveThread,
  refreshActiveThread: noopRefreshActiveThread,
  threadListVersion: 0,
  bumpThreadListVersion: noopBumpThreadListVersion,
  retryConnection: noopRetryConnection,
});

function wait(milliseconds: number): Promise<void> {
  const waitPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
  return waitPromise;
}

async function connectCompanion(
  setStatus: (status: CompanionStatus) => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  for (let attempt = 0; attempt < CONNECT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await companionApi.connect();
      setStatus("ready");
      logInfo("[Companion] online");
      return;
    } catch (error) {
      logWarn("[Companion] connect attempt failed", attempt + 1, error);
      const isLastAttempt = attempt === CONNECT_MAX_ATTEMPTS - 1;
      if (!isLastAttempt) {
        await wait(CONNECT_BACKOFF_MS[attempt]);
      }
    }
  }
  setStatus("offline");
  logInfo("[Companion] offline");
}

async function fetchFreshThread(
  threadKey: string,
): Promise<CompanionThread | null> {
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    return null;
  }
  const companionApi = getCompanionApi();
  const freshThread = await companionApi.getOrCreateThread(
    threadKey,
    resourceId,
  );
  return freshThread;
}

function scheduleLatestMessageClear(
  setLatestMessage: (message: CompanionMessage | null) => void,
): void {
  setTimeout(() => {
    setLatestMessage(null);
  }, POPUP_VISIBLE_DURATION_MS);
}

interface CompanionProviderProps {
  children: ReactNode;
}

export const CompanionProvider = ({ children }: CompanionProviderProps) => {
  const [status, setStatus] = useState<CompanionStatus>("connecting");
  const [latestMessage, setLatestMessage] = useState<CompanionMessage | null>(
    null,
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<CompanionThread | null>(
    null,
  );
  const [threadListVersion, setThreadListVersion] = useState(0);

  const bumpThreadListVersion = useCallback(() => {
    setThreadListVersion((currentVersion) => currentVersion + 1);
  }, []);

  useEffect(() => {
    logInfo("[Companion] sleeping");
    connectCompanion(setStatus);
  }, []);

  function retryConnection(): void {
    setStatus("connecting");
    connectCompanion(setStatus);
  }

  function refreshActiveThread(threadKey: string): void {
    logTrace("[Companion:refreshActiveThread] fetching", threadKey);
    fetchFreshThread(threadKey)
      .then((freshThread) => {
        logTrace("[Companion:refreshActiveThread] fetched", freshThread);
        setActiveThread((currentThread) => {
          if (!freshThread || currentThread?.threadKey !== threadKey) {
            return currentThread;
          }
          return freshThread;
        });
      })
      .catch((error) => {
        logError("[Companion:refreshActiveThread] failed", error);
      });
  }

  function showTransientMessage(message: CompanionMessage): void {
    setLatestMessage(message);
    scheduleLatestMessageClear(setLatestMessage);
  }

  function reportCompanionMessage(
    threadKey: string,
    message: CompanionMessage,
  ): void {
    showTransientMessage(message);
    refreshActiveThread(threadKey);
  }

  const contextValue: CompanionContextType = {
    status,
    isChatOpen,
    setIsChatOpen,
    latestMessage,
    showTransientMessage,
    reportCompanionMessage,
    activeThread,
    reportActiveThread: setActiveThread,
    refreshActiveThread,
    threadListVersion,
    bumpThreadListVersion,
    retryConnection,
  };

  const content = (
    <CompanionContext.Provider value={contextValue}>
      {children}
    </CompanionContext.Provider>
  );
  return content;
};
