import { useContext, useState } from "react";
import { CompanionContext, CompanionStatus } from "@/context/CompanionContext";
import { useCompanionThreadList } from "@/hooks/companion/useCompanionThreadList";
import { CompanionThread, getCompanionApi } from "@/services/companionApi";
import { logError, logInfo } from "@/services/appLogger";
import { UserTable } from "@/services/database";

async function sendUserMessage(
  threadKey: string,
  text: string,
  refreshActiveThread: (threadKey: string) => void,
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    logInfo("[Companion:agentChat] empty text, not sending");
    return;
  }
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    logInfo("[Companion:agentChat] no resourceId, not sending");
    return;
  }
  logInfo("[Companion:agentChat] sending", threadKey, trimmedText);
  try {
    const companionApi = getCompanionApi();
    const reply = await companionApi.sendUserMessage(
      threadKey,
      trimmedText,
      resourceId,
    );
    logInfo("[Companion:agentChat] reply received", reply);
    refreshActiveThread(threadKey);
  } catch (error) {
    logError("[Companion:agentChat] send failed", error);
  }
}

async function loadSelectedThread(
  threadKey: string,
  reportActiveThread: (thread: CompanionThread) => void,
): Promise<void> {
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    return;
  }
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(threadKey, resourceId);
  reportActiveThread(thread);
}

interface UseAgentChatScreenResult {
  status: CompanionStatus;
  activeThread: CompanionThread | null;
  threads: CompanionThread[];
  inputText: string;
  setInputText: (text: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSend: () => void;
  onSelectThread: (threadKey: string) => void;
}

export function useAgentChatScreen(): UseAgentChatScreenResult {
  const {
    status,
    activeThread,
    refreshActiveThread,
    reportActiveThread,
    threadListVersion,
  } = useContext(CompanionContext);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { threads } = useCompanionThreadList(
    !!activeThread && status === "ready",
    threadListVersion,
  );

  function onToggleSidebar(): void {
    setIsSidebarOpen((currentIsSidebarOpen) => !currentIsSidebarOpen);
  }

  function onSend(): void {
    if (!activeThread) {
      return;
    }
    const threadKey = activeThread.threadKey;
    const textToSend = inputText;
    setInputText("");
    sendUserMessage(threadKey, textToSend, refreshActiveThread);
  }

  function onSelectThread(selectedThreadKey: string): void {
    loadSelectedThread(selectedThreadKey, reportActiveThread);
  }

  return {
    status,
    activeThread,
    threads,
    inputText,
    setInputText,
    isSidebarOpen,
    onToggleSidebar,
    onSend,
    onSelectThread,
  };
}
