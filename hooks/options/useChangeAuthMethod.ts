import { useEffect, useState } from "react";
import type { PreferredAuthMethod } from "@/constants/authMethod";
import {
  getRegisteredUserId,
  setUserPreferredLoginMethod,
} from "@/services/database";
import { useUserSession } from "@/hooks/welcome/useUserSession";

// Custom hook that encapsulates the preferred authentication method change:
// a local selection seeded from the current DB value, saved on demand.
export function useChangeAuthMethod() {
  const { preferredLoginMethod } = useUserSession();
  const [selectedMethod, setSelectedMethod] =
    useState<PreferredAuthMethod>("PASSWORD");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferredLoginMethod) {
      setSelectedMethod(preferredLoginMethod as PreferredAuthMethod);
    }
  }, [preferredLoginMethod]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = getRegisteredUserId();
      if (!userId) return;

      setUserPreferredLoginMethod(userId, selectedMethod);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    selectedMethod,
    setSelectedMethod,
    isSaveEnabled: selectedMethod !== preferredLoginMethod,
    isSaving,
    handleSave,
  };
}
