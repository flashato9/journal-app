import { useEffect } from "react";
import { CompanionPageSnapshot } from "@/services/companionApi";

export function useCompanionPageSnapshot(
  threadKey: string,
  snapshot: CompanionPageSnapshot,
): void {
  // Callers pass a fresh object literal each render, so depend on its
  // serialized content rather than reference identity - otherwise this
  // would fire on every re-render, not just when the snapshot changes.
  const snapshotKey = JSON.stringify(snapshot);

  useEffect(() => {
    console.log("[Companion:sees]", threadKey, snapshot);
  }, [threadKey, snapshotKey]);
}
