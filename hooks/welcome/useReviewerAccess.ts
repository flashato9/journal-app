import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useRef, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import {
  getReviewerPassword,
  getReviewerUsername,
} from "@/constants/reviewerAccess";
import { completeUserSession } from "@/hooks/welcome/completeUserSession";
import { UserTable } from "@/services/database";
import { savePlaceholderProfilePicture } from "@/services/profilePictureStorage";

const REVIEWER_UNLOCK_TAP_THRESHOLD = 10;
const REVIEWER_UNLOCK_TAP_RESET_DELAY_MS = 10000;

// Creates the reviewer's SecureStore credential and DB user row the first
// time the reviewer account is used, mirroring useRegister's handleRegister.
async function seedReviewerAccount(
  username: string,
  password: string,
): Promise<void> {
  if (UserTable.isUserExists(username)) return;

  const key = `login.${username}`;
  await SecureStore.setItemAsync(key, password);

  const userId = UserTable.insertUserIntoDB(username);
  UserTable.setUserPreferredLoginMethod(userId, "PASSWORD");

  const profileImagePath = await savePlaceholderProfilePicture();
  UserTable.setUserProfileImagePath(userId, profileImagePath);
}

// Hidden logic for the Register screen's 10-tap title counter: on the 10th
// quick tap, seeds the hardcoded Play reviewer account (if not already
// seeded) and logs straight into the app, skipping any manual entry for this
// first run. Later app opens hit the normal Login screen and prompt for the
// reviewer password like any other returning user.
export function useReviewerAccess() {
  const router = useRouter();
  const { setUsername: setAuthUsername, setLocationSettings } =
    useContext(AuthContext);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const titleTapResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const unlockReviewerAccess = async () => {
    try {
      const reviewerUsername = getReviewerUsername();
      const reviewerPassword = getReviewerPassword();
      await seedReviewerAccount(reviewerUsername, reviewerPassword);
      await completeUserSession(
        reviewerUsername,
        setAuthUsername,
        setLocationSettings,
        router,
      );
    } catch (error) {
      console.error("Error during reviewer access unlock:", error);
      Alert.alert(
        "Reviewer Login Failed",
        "An error occurred. Please try again.",
      );
    }
  };

  const showPermissionsReminder = () => {
    Alert.alert(
      "Permissions Needed",
      'Please allow notifications and set location tracking to "Always" when prompted, so every reviewer feature works correctly.',
      [{ text: "OK", onPress: unlockReviewerAccess }],
    );
  };

  const confirmReviewerUnlock = () => {
    Alert.alert(
      "Reviewer Access Unlocked",
      "You have tapped 10 times and unlocked the reviewer account. Would you like to proceed?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: showPermissionsReminder },
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
