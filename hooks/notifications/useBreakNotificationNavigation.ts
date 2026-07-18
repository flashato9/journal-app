import { useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  getBreakNotificationType,
  getNotificationsModule,
  isSendNotificationsEnabled,
} from "@/services/locationService";

type AppRouter = ReturnType<typeof useRouter>;

// Pure check for whether a notification should navigate to Create Memory.
function isBreakNotificationForLoggedInUser(
  data: unknown,
  username: string | null,
): boolean {
  const isMatch =
    !!username &&
    typeof data === "object" &&
    data !== null &&
    (data as { type?: string }).type === getBreakNotificationType();
  return isMatch;
}

// Registers the break-notification tap listener and handles a cold-start tap.
async function registerBreakNotificationListener(
  username: string | null,
  router: AppRouter,
) {
  const Notifications = await getNotificationsModule();

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (
    lastResponse &&
    isBreakNotificationForLoggedInUser(
      lastResponse.notification.request.content.data,
      username,
    )
  ) {
    router.push("/(memories)/creatememory");
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: {
      notification: { request: { content: { data: unknown } } };
    }) => {
      if (
        isBreakNotificationForLoggedInUser(
          response.notification.request.content.data,
          username,
        )
      ) {
        router.push("/(memories)/creatememory");
      }
    },
  );
  return subscription;
}

// Navigates to Create Memory when a break-reminder notification is tapped.
export function useBreakNotificationNavigation() {
  const { username } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isSendNotificationsEnabled()) return;

    const subscriptionRef: { current?: { remove: () => void } } = {};

    registerBreakNotificationListener(username, router).then((sub) => {
      subscriptionRef.current = sub;
    });

    const cleanup = () => subscriptionRef.current?.remove();
    return cleanup;
  }, [username, router]);
}
