import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

// Refreshes location tracking status immediately on screen focus instead of waiting for OptionsMenuContext's next poll.
export function useRefreshLocationTrackingOnFocus(
  refreshLocationTrackingStatus: () => void,
) {
  useFocusEffect(
    useCallback(() => {
      refreshLocationTrackingStatus();
    }, [refreshLocationTrackingStatus]),
  );
}
