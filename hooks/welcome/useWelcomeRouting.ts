import { useRouter } from "expo-router";
import { useEffect } from "react";
import { isUserRegistered } from "@/services/database";

// Decides whether to send the user to the login or register screen,
// based on whether a user has ever been registered on this device.
function decideDestination(): "/(welcome)/login" | "/(welcome)/register" {
  return isUserRegistered() ? "/(welcome)/login" : "/(welcome)/register";
}

export function useWelcomeRouting() {
  const router = useRouter();

  useEffect(() => {
    router.replace(decideDestination());
  }, [router]);
}
