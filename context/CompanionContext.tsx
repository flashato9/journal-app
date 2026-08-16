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

export type CompanionStatus = "connecting" | "ready";

const POPUP_VISIBLE_DURATION_MS = 4000;

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
}

function noopShowTransientMessage(): void {}
function noopReportCompanionMessage(): void {}
function noopSetIsChatOpen(): void {}
function noopReportActiveThread(): void {}
function noopRefreshActiveThread(): void {}
function noopBumpThreadListVersion(): void {}

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
});

async function connectCompanion(
  setStatus: (status: CompanionStatus) => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  await companionApi.connect();
  setStatus("ready");
  console.log("[Companion] online");
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
    console.log("[Companion] sleeping");
    connectCompanion(setStatus);
  }, []);

  function refreshActiveThread(threadKey: string): void {
    const companionApi = getCompanionApi();
    const freshThread = companionApi.peekThread(threadKey);
    setActiveThread((currentThread) => {
      if (!freshThread || currentThread?.threadKey !== threadKey) {
        return currentThread;
      }
      return freshThread;
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
  };

  const content = (
    <CompanionContext.Provider value={contextValue}>
      {children}
    </CompanionContext.Provider>
  );
  return content;
};
