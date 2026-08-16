import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useContext, useState } from "react";
import { CompanionContext } from "@/context/CompanionContext";
import { CompanionThread, getCompanionApi } from "@/services/companionApi";

async function loadCompanionThread(
  threadKey: string,
  isChatOpen: boolean,
  setThread: (thread: CompanionThread) => void,
  reportActiveThread: (thread: CompanionThread) => void,
  bumpThreadListVersion: () => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(threadKey);
  setThread(thread);
  bumpThreadListVersion();
  if (isChatOpen) {
    return;
  }
  reportActiveThread(thread);
}

interface UseCompanionThreadResult {
  thread: CompanionThread | null;
}

export function useCompanionThread(
  threadKey: string,
): UseCompanionThreadResult {
  const [thread, setThread] = useState<CompanionThread | null>(null);
  const { isChatOpen, reportActiveThread, bumpThreadListVersion } =
    useContext(CompanionContext);

  useFocusEffect(
    useCallback(() => {
      loadCompanionThread(
        threadKey,
        isChatOpen,
        setThread,
        reportActiveThread,
        bumpThreadListVersion,
      );
    }, [threadKey, isChatOpen, reportActiveThread, bumpThreadListVersion]),
  );

  return { thread };
}
