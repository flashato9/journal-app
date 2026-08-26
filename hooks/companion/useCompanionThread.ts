import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useContext, useState } from "react";
import { CompanionContext } from "@/context/CompanionContext";
import { CompanionThread, getCompanionApi } from "@/services/companionApi";
import { UserTable } from "@/services/database";

async function loadCompanionThread(
  threadKey: string,
  resourceId: string,
  isChatOpen: boolean,
  setThread: (thread: CompanionThread) => void,
  reportActiveThread: (thread: CompanionThread) => void,
  bumpThreadListVersion: () => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(threadKey, resourceId);
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
  const { status, isChatOpen, reportActiveThread, bumpThreadListVersion } =
    useContext(CompanionContext);

  useFocusEffect(
    useCallback(() => {
      if (status !== "ready") {
        return;
      }
      const resourceId = UserTable.getOrCreateCompanionResourceId();
      if (!resourceId) {
        return;
      }
      loadCompanionThread(
        threadKey,
        resourceId,
        isChatOpen,
        setThread,
        reportActiveThread,
        bumpThreadListVersion,
      );
    }, [
      threadKey,
      status,
      isChatOpen,
      reportActiveThread,
      bumpThreadListVersion,
    ]),
  );

  return { thread };
}
