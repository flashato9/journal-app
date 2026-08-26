import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";
import type { PreferredAuthMethod } from "@/constants/authMethod";
import {
  getReviewerPassword,
  getReviewerUsername,
} from "@/constants/reviewerAccess";
import { logError } from "@/services/appLogger";

const REVIEWER_UNLOCK_TAP_THRESHOLD = 5;
const REVIEWER_UNLOCK_TAP_RESET_DELAY_MS = 10000;

type RegistrationOutcome = "created" | "already_exists";
type RegisterAccount = (
  username: string,
  password: string,
  preferredAuthMethod: PreferredAuthMethod,
  profileImageUri: string | null,
) => Promise<RegistrationOutcome>;

// Hidden logic for the Register screen's 5-tap title counter: on the 5th
// quick tap, runs the same account-creation path a real registration would
// (with the hardcoded Play reviewer credentials) and lands on the Login
// screen, skipping manual form entry for this first run. If the reviewer
// account already exists from a previous unlock, registration is skipped
// silently and the reviewer is still sent to the Login screen.
export function useReviewerAccess(registerAccount: RegisterAccount) {
  const router = useRouter();
  const [titleTapCount, setTitleTapCount] = useState(0);
  const titleTapResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const unlockReviewerAccess = async () => {
    try {
      const reviewerUsername = getReviewerUsername();
      const reviewerPassword = getReviewerPassword();
      await registerAccount(
        reviewerUsername,
        reviewerPassword,
        "PASSWORD",
        null,
      );
      router.replace("/(welcome)/login");
    } catch (error) {
      logError("Error during reviewer access unlock:", error);
      Alert.alert(
        "Reviewer Login Failed",
        "An error occurred. Please try again.",
      );
    }
  };

  const confirmReviewerUnlock = () => {
    Alert.alert(
      "Reviewer Access Unlocked",
      `You have tapped ${REVIEWER_UNLOCK_TAP_THRESHOLD} times and unlocked the reviewer account. Would you like to proceed?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: unlockReviewerAccess },
      ],
    );
  };

  const handleTitleTap = () => {
    if (titleTapResetTimeoutRef.current) {
      clearTimeout(titleTapResetTimeoutRef.current);
      titleTapResetTimeoutRef.current = null;
    }

    const nextTapCount = titleTapCount + 1;
    if (nextTapCount >= REVIEWER_UNLOCK_TAP_THRESHOLD) {
      setTitleTapCount(0);
      confirmReviewerUnlock();
      return;
    }

    setTitleTapCount(nextTapCount);
    titleTapResetTimeoutRef.current = setTimeout(() => {
      setTitleTapCount(0);
    }, REVIEWER_UNLOCK_TAP_RESET_DELAY_MS);
  };

  return {
    handleTitleTap,
  };
}
