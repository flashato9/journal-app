import { useEffect, useState } from "react";
import { CompanionThread, getCompanionApi } from "@/services/companionApi";

async function loadCompanionThread(
  threadKey: string,
  setThread: (thread: CompanionThread) => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(threadKey);
  setThread(thread);
}

interface UseCompanionThreadResult {
  thread: CompanionThread | null;
}

export function useCompanionThread(
  threadKey: string,
): UseCompanionThreadResult {
  const [thread, setThread] = useState<CompanionThread | null>(null);

  useEffect(() => {
    loadCompanionThread(threadKey, setThread);
  }, [threadKey]);

  return { thread };
}
