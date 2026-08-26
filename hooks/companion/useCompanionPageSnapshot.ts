import { useContext, useEffect } from "react";
import { CompanionContext, CompanionStatus } from "@/context/CompanionContext";
import { logTrace } from "@/services/appLogger";
import { CompanionFieldVisibilityTable, UserTable } from "@/services/database";
import {
  CompanionMessage,
  CompanionPageSnapshot,
  getCompanionApi,
} from "@/services/companionApi";

const REMARK_SETTLE_DELAY_MS = 1500;

const inFlightRemarkThreadKeys = new Set<string>();

async function triggerCompanionRemark(
  threadKey: string,
  visibleSnapshot: CompanionPageSnapshot,
  resourceId: string,
  status: CompanionStatus,
  reportCompanionMessage: (
    threadKey: string,
    message: CompanionMessage,
  ) => void,
): Promise<void> {
  if (status !== "ready") {
    return;
  }
  if (inFlightRemarkThreadKeys.has(threadKey)) {
    return;
  }
  inFlightRemarkThreadKeys.add(threadKey);
  const companionApi = getCompanionApi();
  const message = await companionApi.generateRemark(
    threadKey,
    visibleSnapshot,
    resourceId,
  );
  inFlightRemarkThreadKeys.delete(threadKey);
  reportCompanionMessage(threadKey, message);
}

function scheduleCompanionRemark(
  threadKey: string,
  visibleSnapshot: CompanionPageSnapshot,
  resourceId: string,
  status: CompanionStatus,
  reportCompanionMessage: (
    threadKey: string,
    message: CompanionMessage,
  ) => void,
): () => void {
  const settleTimeoutId = setTimeout(() => {
    triggerCompanionRemark(
      threadKey,
      visibleSnapshot,
      resourceId,
      status,
      reportCompanionMessage,
    );
  }, REMARK_SETTLE_DELAY_MS);
  const cancelSettleTimeout = () => clearTimeout(settleTimeoutId);
  return cancelSettleTimeout;
}

function computeVisibleSnapshot(
  threadKey: string,
  snapshot: CompanionPageSnapshot,
): CompanionPageSnapshot {
  const userId = UserTable.getRegisteredUserId();
  const hiddenFields = userId
    ? CompanionFieldVisibilityTable.getHiddenFields(userId, threadKey)
    : [];

  const visibleSnapshot =
    hiddenFields.length === 0
      ? snapshot
      : Object.fromEntries(
          Object.entries(snapshot).filter(
            ([key]) => !hiddenFields.includes(key),
          ),
        );
  return visibleSnapshot;
}

export function useCompanionPageSnapshot(
  threadKey: string,
  snapshot: CompanionPageSnapshot,
): void {
  const { status, reportCompanionMessage } = useContext(CompanionContext);
  const snapshotKey = JSON.stringify(snapshot);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    const resourceId = UserTable.getOrCreateCompanionResourceId();
    if (!resourceId) {
      return;
    }
    const visibleSnapshot = computeVisibleSnapshot(threadKey, snapshot);
    logTrace("[Companion:sees]", threadKey, visibleSnapshot);
    const cancelSettleTimeout = scheduleCompanionRemark(
      threadKey,
      visibleSnapshot,
      resourceId,
      status,
      reportCompanionMessage,
    );
    return cancelSettleTimeout;
  }, [threadKey, snapshotKey, status, reportCompanionMessage]);
}
