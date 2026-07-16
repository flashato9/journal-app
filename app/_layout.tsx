import { Stack, useRouter } from "expo-router";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { OptionsMenuProvider } from "../context/OptionsMenuContext";
import { initializeDatabase } from "../services/database";
import {
  saveImagePersistently,
  saveVideoPersistently,
} from "../services/mediaStorage";
import { initializeLogger } from "../services/logger";
import {
  BREAK_NOTIFICATION_TYPE,
  getNotificationsModule,
  SEND_NOTIFICATIONS,
} from "../services/locationService";
import LoadingIndicator from "@/components/LoadingIndicator";
import OptionsMenu from "@/components/OptionsMenu";

function RootLayoutContent() {
  const { username } = useContext(AuthContext);
  const [isDbReady, setIsDbReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      // Start the logger first so it can capture logs from database init
      await initializeLogger();
      await initializeDatabase();
      setIsDbReady(true);
    };
    initialize();
  }, []);

  // Tapping a break-reminder notification should jump straight to creating
  // a memory, whether the app was already running (the listener) or fully
  // closed (the cold-start check via getLastNotificationResponseAsync).
  useEffect(() => {
    if (!SEND_NOTIFICATIONS) return;

    const goToCreateMemoryIfBreakNotification = (data: unknown) => {
      if (
        username &&
        typeof data === "object" &&
        data !== null &&
        (data as { type?: string }).type === BREAK_NOTIFICATION_TYPE
      ) {
        router.push("/(memories)/creatememory");
      }
    };

    let subscription: { remove: () => void } | undefined;

    (async () => {
      const Notifications = await getNotificationsModule();

      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        goToCreateMemoryIfBreakNotification(
          lastResponse.notification.request.content.data,
        );
      }

      subscription = Notifications.addNotificationResponseReceivedListener(
        (response: {
          notification: { request: { content: { data: unknown } } };
        }) => {
          goToCreateMemoryIfBreakNotification(
            response.notification.request.content.data,
          );
        },
      );
    })();

    return () => subscription?.remove();
  }, [username, router]);

  // Receiving a shared image/video (from the OS share sheet) jumps to
  // Create Memory with it pre-attached — no auto-save, the user still
  // fills in the rest and taps Save themselves. Waits on `username` the
  // same way the notification handler above does, so a share received
  // while logged out is simply picked up once login completes.
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  useEffect(() => {
    if (!username || !hasShareIntent) return;

    const file = shareIntent.files?.[0];
    if (!file) return;

    (async () => {
      try {
        const isVideo = file.mimeType.startsWith("video/");
        const saved = isVideo
          ? await saveVideoPersistently(file.path)
          : await saveImagePersistently(file.path);

        router.push({
          pathname: "/(memories)/creatememory",
          params: {
            sharedMediaUri: saved.uri,
            sharedMediaType: isVideo ? "video" : "image",
            // Route params are strings only; omit rather than send "null".
            ...(saved.mediaLibraryAssetId
              ? { sharedMediaAssetId: saved.mediaLibraryAssetId }
              : {}),
          },
        });
      } catch (err) {
        console.error("Error handling shared media:", err);
      } finally {
        resetShareIntent();
      }
    })();
  }, [username, hasShareIntent, shareIntent, router, resetShareIntent]);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <Stack
      key={username ? "authenticated" : "unauthenticated"}
      screenOptions={{ headerShown: false }}
    >
      {username ? (
        <Stack.Screen name="(memories)" />
      ) : (
        <Stack.Screen name="(welcome)" />
      )}
      <Stack.Screen name="(options)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <AuthProvider>
        <OptionsMenuProvider>
          <RootLayoutContent />
          <OptionsMenu />
        </OptionsMenuProvider>
      </AuthProvider>
    </ShareIntentProvider>
  );
}
