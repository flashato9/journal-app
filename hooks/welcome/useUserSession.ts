import { useEffect, useState } from "react";
import { getRegisteredUserId, getUserProfile } from "@/services/database";

// Loads the profile (username + profile image + preferred login method) of
// the user registered on this device, for screens that show it before login
// (e.g. the login screen).
export function useUserSession() {
  const [username, setUsername] = useState<string | null>(null);
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [preferredLoginMethod, setPreferredLoginMethod] = useState<
    string | null
  >(null);

  useEffect(() => {
    const userId = getRegisteredUserId();
    if (!userId) return;

    const profile = getUserProfile(userId);
    if (!profile) return;

    setUsername(profile.username);
    setProfileImagePath(profile.profileImagePath);
    setPreferredLoginMethod(profile.preferredLoginMethod);
  }, []);

  return { username, profileImagePath, preferredLoginMethod };
}
