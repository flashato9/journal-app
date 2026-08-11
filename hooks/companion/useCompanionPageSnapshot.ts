import { useEffect } from "react";
import { CompanionFieldVisibilityTable, UserTable } from "@/services/database";
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
    // The device has one registered user, so this works even before login
    // (Register, Login), unlike AuthContext.username which is only set
    // once a session exists.
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

    console.log("[Companion:sees]", threadKey, visibleSnapshot);
  }, [threadKey, snapshotKey]);
}
