import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

const SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(SHOW_EVENT, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(HIDE_EVENT, () => {
      setKeyboardHeight(0);
    });

    function cleanupSubscriptions(): void {
      showSubscription.remove();
      hideSubscription.remove();
    }
    return cleanupSubscriptions;
  }, []);

  return keyboardHeight;
}
