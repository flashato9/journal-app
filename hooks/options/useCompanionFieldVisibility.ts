import { useCallback, useEffect, useState } from "react";
import { COMPANION_NARROWABLE_FIELDS } from "@/constants/companionFields";
import { CompanionFieldVisibilityTable, UserTable } from "@/services/database";

function fieldId(screenKey: string, fieldKey: string): string {
  return `${screenKey}.${fieldKey}`;
}

// Powers the Settings toggle list: loads which narrowable fields are
// currently hidden for the device's registered user, and writes toggles
// straight to the DB (no separate save step, like other boolean settings).
export function useCompanionFieldVisibility() {
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = UserTable.getRegisteredUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    const screenKeys = [
      ...new Set(COMPANION_NARROWABLE_FIELDS.map((field) => field.screenKey)),
    ];
    const hidden = new Set<string>();
    for (const screenKey of screenKeys) {
      const hiddenFields = CompanionFieldVisibilityTable.getHiddenFields(
        userId,
        screenKey,
      );
      for (const fieldKey of hiddenFields) {
        hidden.add(fieldId(screenKey, fieldKey));
      }
    }
    setHiddenFieldIds(hidden);
    setLoading(false);
  }, []);

  const isFieldHidden = useCallback(
    (screenKey: string, fieldKey: string) =>
      hiddenFieldIds.has(fieldId(screenKey, fieldKey)),
    [hiddenFieldIds],
  );

  const toggleField = useCallback(
    (screenKey: string, fieldKey: string, hidden: boolean) => {
      const userId = UserTable.getRegisteredUserId();
      if (!userId) return;

      CompanionFieldVisibilityTable.setFieldHidden(
        userId,
        screenKey,
        fieldKey,
        hidden,
      );
      setHiddenFieldIds((current) => {
        const next = new Set(current);
        const id = fieldId(screenKey, fieldKey);
        if (hidden) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [],
  );

  return { loading, isFieldHidden, toggleField };
}
