import { useEffect, useState } from "react";
import { CompanionThread, getCompanionApi } from "@/services/companionApi";
import { logTrace } from "@/services/appLogger";

async function loadThreadList(
  setThreads: (threads: CompanionThread[]) => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  logTrace("CompanionChatPopover - about to run listThreads");
  const threads = await companionApi.listThreads();
  logTrace("CompanionChatPopover - after running listThreads");
  setThreads(threads);
}

interface UseCompanionThreadListResult {
  threads: CompanionThread[];
}

export function useCompanionThreadList(
  isEnabled: boolean,
  threadListVersion: number,
): UseCompanionThreadListResult {
  const [threads, setThreads] = useState<CompanionThread[]>([]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    loadThreadList(setThreads);
  }, [isEnabled, threadListVersion]);

  return { threads };
}
