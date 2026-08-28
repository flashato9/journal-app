import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { getDistance } from "geolib";
import { Alert, Platform } from "react-native";
import { logError, logInfo, logTrace, logWarn } from "@/services/appLogger";
import {
  LocationTable,
  NotificationTable,
  TimeMemoryTable,
  UserTable,
} from "./database";
import * as LocationSettingsStore from "./locationSettingsStore";

// Local notifications are unavailable only in Expo Go (SDK 53+); dev and
// production builds support them. Background location requires a dev build
// anyway, so this is effectively always true where tracking works.
export const isSendNotificationsEnabled = (): boolean => {
  const isNotExpoGo =
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
  return isNotExpoGo;
};

// Marker stored in a break notification's `data` payload, read by
// the break-notification-tap handler to know to navigate to the
// create-memory screen.
export const getBreakNotificationType = (): string => {
  const breakNotificationType = "break-reminder";
  return breakNotificationType;
};

// Lazy load notifications to avoid module initialization errors in Expo Go
let NotificationsModule: any = null;
export const getNotificationsModule = async () => {
  if (!NotificationsModule) {
    NotificationsModule = await import("expo-notifications");
    // Without a handler, notifications that arrive while the app is
    // foregrounded are not displayed at all
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return NotificationsModule;
};

const LOCATION_TASK_NAME = "background-location-task";

// Shape returned by getLatestLocation; captured once per task invocation,
// BEFORE inserting the current location, so stage 3 can measure the rest gap
type PreviousLocation = {
  latitude: number;
  longitude: number;
  createdDateTime: string;
} | null;

// ===== HELPER: Stage 1 - Distance Filter (1m threshold) =====

const stage1DistanceFilter = (
  previousLocation: PreviousLocation,
  currentLat: number,
  currentLon: number,
): boolean => {
  if (!previousLocation) {
    logTrace(`📍 First location recorded`);
    return true; // No previous location, proceed to recording
  }

  const distanceFrom1mFilter = getDistance(
    {
      latitude: previousLocation.latitude,
      longitude: previousLocation.longitude,
    },
    { latitude: currentLat, longitude: currentLon },
  );

  if (distanceFrom1mFilter <= 1) {
    logTrace(
      `⏭️  Distance ${distanceFrom1mFilter.toFixed(2)}m <= 1m, skipping record`,
    );
    return false; // Skip recording
  }

  return true; // Record this location
};

// ===== HELPER: Stage 2 - Notification Threshold Check =====

const stage2NotificationThresholdCheck = (
  userId: number,
  currentLat: number,
  currentLon: number,
  notificationThreshold: number,
): {
  shouldProceed: boolean;
  distanceFromMemory: number | "FIRST_MEMORY";
  threshold: number;
} => {
  const latestMemory = TimeMemoryTable.getLatestTimeMemoryWithLocation(userId);
  if (!latestMemory || !latestMemory.latitude || !latestMemory.longitude) {
    // No previous memory to measure against — treat that as being
    // unboundedly far from "the last memory," so the check passes through
    // to the rest-period stage instead of blocking forever.
    logTrace(
      `⚠️  No previous memory with location — treating distance as unbounded, checking rest period`,
    );
    return {
      shouldProceed: true,
      distanceFromMemory: "FIRST_MEMORY",
      threshold: notificationThreshold,
    };
  }

  const distanceFromMemory = getDistance(
    {
      latitude: latestMemory.latitude,
      longitude: latestMemory.longitude,
    },
    { latitude: currentLat, longitude: currentLon },
  );

  if (distanceFromMemory <= notificationThreshold) {
    logTrace(
      `⏭️  Distance ${distanceFromMemory.toFixed(2)}m <= threshold ${notificationThreshold}m, no notification`,
    );
    return {
      shouldProceed: false,
      distanceFromMemory,
      threshold: notificationThreshold,
    };
  }

  logTrace(
    `⚠️  Distance ${distanceFromMemory.toFixed(2)}m > threshold ${notificationThreshold}m, checking rest period`,
  );
  return {
    shouldProceed: true,
    distanceFromMemory,
    threshold: notificationThreshold,
  };
};

// ===== HELPER: Live status notification text =====

// One-line, weather-app-style status shown in a separate live-status
// notification (kept distinct from the mandatory foreground-service
// notification, which can't be updated without patching expo-location) —
// purely informational, independent of whether an actual break notification
// fires.
const buildStatusMessage = (
  isMoving: boolean,
  distanceFromMemory: number | "FIRST_MEMORY",
  notificationThreshold: number,
  restThreshold: number,
  previousLocation: PreviousLocation,
): string => {
  if (distanceFromMemory === "FIRST_MEMORY") {
    return "No memories yet — create one anytime.";
  }

  const distanceText = `${distanceFromMemory.toFixed(0)}m from your last memory`;

  if (distanceFromMemory <= notificationThreshold) {
    return `${distanceText}.`;
  }

  if (isMoving || !previousLocation) {
    return `${distanceText} — still traveling.`;
  }

  const secondsResting =
    (Date.now() - new Date(previousLocation.createdDateTime).getTime()) / 1000;

  if (secondsResting <= restThreshold) {
    const secondsLeft = Math.max(0, Math.round(restThreshold - secondsResting));
    return `${distanceText}, resting — ${secondsLeft}s until a break reminder.`;
  }

  return "On a break — go create a memory whenever you're ready!";
};

const TRACKING_NOTIFICATION_TITLE = "Journal is tracking your walk";

// Fixed identifier: scheduling with the same identifier again replaces this
// notification's content in place instead of stacking a new one each cycle.
const LIVE_STATUS_NOTIFICATION_ID = "live-status-notification";
const STATUS_NOTIFICATION_CHANNEL_ID = "status-updates";

const updateLiveStatusNotification = async (status: string): Promise<void> => {
  if (!isSendNotificationsEnabled()) {
    return;
  }

  try {
    const Notifications = await getNotificationsModule();
    await Notifications.scheduleNotificationAsync({
      identifier: LIVE_STATUS_NOTIFICATION_ID,
      content: {
        title: TRACKING_NOTIFICATION_TITLE,
        body: status,
        sticky: true,
      },
      trigger: { channelId: STATUS_NOTIFICATION_CHANNEL_ID },
    });
  } catch (err) {
    logWarn("⚠️  Could not update live status notification:", err);
  }
};

// ===== HELPER: Stage 3 - Rest Period + Duplicate Prevention =====

const stage3RestPeriodAndNotify = async (
  userId: number,
  distanceFromMemory: number | "FIRST_MEMORY",
  notificationThreshold: number,
  restThreshold: number,
  previousLocation: PreviousLocation,
): Promise<void> => {
  // previousLocation was captured before the current location was inserted;
  // querying the DB here would return the just-inserted row and the rest
  // gap would always be ~0s
  if (!previousLocation) {
    logTrace(`⏭️  No location to check rest period`);
    return;
  }

  const lastLocationTime = new Date(previousLocation.createdDateTime).getTime();
  const currentTime = new Date().getTime();
  const timeSinceLastLocation = (currentTime - lastLocationTime) / 1000; // seconds

  if (timeSinceLastLocation <= restThreshold) {
    logTrace(
      `⏭️  Only ${timeSinceLastLocation.toFixed(1)}s passed < ${restThreshold}s rest period`,
    );
    return;
  }

  logTrace(
    `✓ ${timeSinceLastLocation.toFixed(1)}s > ${restThreshold}s rest period, ready to notify`,
  );

  // Build notification message. distanceFromMemory is "FIRST_MEMORY" when
  // there's no previous memory with a location to measure against.
  const notificationMessage =
    distanceFromMemory !== "FIRST_MEMORY"
      ? `Hey we noticed you're on a break and you have traveled more than ${notificationThreshold} meters since your last memory. Exactly - ${distanceFromMemory.toFixed(1)} meters.`
      : `Hey we noticed you're on a break! You don't have any memories with a location yet — come create your first one.`;

  // Check for duplicate notification within 5 minutes. Compare against the
  // latest notification regardless of message text — the message embeds the
  // measured distance, so exact-match comparison would never find a duplicate
  const latestNotification = NotificationTable.getLatestNotification(userId);
  if (latestNotification) {
    const notificationTime = new Date(latestNotification.createdAt).getTime();
    const timeSinceNotification = (currentTime - notificationTime) / 1000; // seconds

    if (timeSinceNotification < 300) {
      // 300 seconds = 5 minutes
      logTrace(
        `🔄 Duplicate notification skipped (${timeSinceNotification.toFixed(0)}s < 5min)`,
      );
      return;
    }
  }

  // Send notification
  logInfo(`📬 Sending notification: ${notificationMessage}`);
  NotificationTable.insertNotification(userId, notificationMessage);

  if (isSendNotificationsEnabled()) {
    try {
      const Notifications = await getNotificationsModule();
      await Notifications.scheduleNotificationAsync({
        identifier: LIVE_STATUS_NOTIFICATION_ID,
        content: {
          title: "You're on a break!",
          body: notificationMessage,
          sound: "app_notification.mp3",
          data: { type: getBreakNotificationType() },
        },
        trigger: null,
      });
    } catch (notifError) {
      logWarn(
        "⚠️  Could not send notification from background task:",
        notifError,
      );
    }
  }
};

// ===== BACKGROUND TASK REGISTRATION =====

let taskInvocationCount = 0;

// Register background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  taskInvocationCount++;
  const invocationId = taskInvocationCount;
  const timestamp = new Date().toISOString();

  logTrace(`\n${"=".repeat(70)}`);
  logTrace(`🔵 BACKGROUND TASK INVOCATION #${invocationId} at ${timestamp}`);
  logTrace(`${"=".repeat(70)}`);

  try {
    if (error) {
      logError(`❌ [#${invocationId}] Location tracking error:`, error);
      return;
    }

    if (!data) {
      logWarn(`⚠️  [#${invocationId}] No data passed to location task`);
      return;
    }

    const { locations } = data as {
      locations: Location.LocationObject[];
    };

    if (!locations || locations.length === 0) {
      logWarn(`⚠️  [#${invocationId}] No location data in task`);
      return;
    }

    logTrace(`✅ [#${invocationId}] Received ${locations.length} location(s)`);
    const location = locations[0];
    logTrace(
      `📍 [#${invocationId}] Location: lat=${location.coords.latitude.toFixed(4)}, lon=${location.coords.longitude.toFixed(4)}`,
    );

    let userId: number | null = null;
    try {
      userId = await getUserIdFromStorage();
    } catch (err) {
      logError("❌ Failed to get user ID:", err);
      return;
    }

    if (!userId) {
      logError("❌ No user ID found - cannot process location");
      return;
    }

    logTrace(`👤 User ID: ${userId}`);

    let settings: LocationSettingsStore.LocationSettingsValues | null = null;
    try {
      settings = LocationSettingsStore.getLocationSettings(userId);
    } catch (err) {
      logError("❌ Failed to fetch location settings:", err);
      return;
    }

    if (!settings) {
      logError("❌ No location settings found for user - cannot process");
      return;
    }

    logTrace(
      `⚙️  Settings - fetchFreq: ${settings.fetchFrequency}s, notifThresh: ${settings.notificationThreshold}m, restThresh: ${settings.restThreshold}s`,
    );

    const currentLat = location.coords.latitude;
    const currentLon = location.coords.longitude;
    const currentAlt = location.coords.altitude;

    // Capture the previous location BEFORE inserting the current one — stage 3
    // measures the rest period against its timestamp
    let previousLocation: PreviousLocation = null;
    try {
      previousLocation = LocationTable.getLatestLocation(userId);
    } catch (err) {
      logError("❌ Failed to fetch previous location:", err);
      return;
    }

    // Stage 1: Distance Filter — gates only the DB insert, NOT the
    // notification stages. While the user is resting, updates still arrive
    // but are not recorded, so previousLocation keeps the timestamp of the
    // last movement and stage 3 can detect the rest period as it happens
    let stage1Result = false;
    try {
      stage1Result = stage1DistanceFilter(
        previousLocation,
        currentLat,
        currentLon,
      );
    } catch (err) {
      logError("❌ Error in stage 1 filter:", err);
      return;
    }

    if (stage1Result) {
      try {
        LocationTable.insertLocation(
          userId,
          currentLat,
          currentLon,
          currentAlt,
        );
        logTrace(
          `✅ Location recorded: ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`,
        );
      } catch (err) {
        logError("❌ Failed to insert location:", err);
        return;
      }
    } else {
      logTrace("⏭️  Stage 1 filter blocked recording - location too close");
    }

    // Stage 2: Notification Threshold Check
    let stage2Result: any = null;
    try {
      stage2Result = stage2NotificationThresholdCheck(
        userId,
        currentLat,
        currentLon,
        settings.notificationThreshold,
      );
    } catch (err) {
      logError("❌ Error in stage 2 check:", err);
      return;
    }

    const { shouldProceed, distanceFromMemory, threshold } = stage2Result;

    // Live status notification — informational only, runs every cycle
    // regardless of whether an actual break notification fires below.
    await updateLiveStatusNotification(
      buildStatusMessage(
        stage1Result,
        distanceFromMemory,
        threshold,
        settings.restThreshold,
        previousLocation,
      ),
    );

    if (!shouldProceed) {
      logTrace("⏭️  Stage 2 check blocked - not enough distance from memory");
      return;
    }

    // Stage 3: Rest Period + Duplicate Prevention
    try {
      await stage3RestPeriodAndNotify(
        userId,
        distanceFromMemory,
        threshold,
        settings.restThreshold,
        previousLocation,
      );
    } catch (err) {
      logError(`❌ [#${invocationId}] Error in stage 3:`, err);
    }

    logTrace(`\n✅ [#${invocationId}] Task completed successfully`);
    logTrace(`${"=".repeat(70)}\n`);
  } catch (error) {
    logError(
      `❌ [#${invocationId}] CRITICAL: Unhandled error in location task:`,
      error,
    );
    if (error instanceof Error) {
      logError(`❌ [#${invocationId}] Error stack:`, error.stack);
    }
    logTrace(`${"=".repeat(70)}\n`);
  }
});

// ===== LOCATION TRACKING =====

async function isBackgroundLocationPermissionGranted(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  const isGranted = status === "granted";
  return isGranted;
}

// Play Store's required "prominent disclosure" shown before the system
// background-location permission prompt: explains what's collected, that
// it's collected in the background, and why. Resolves true if the user
// chooses to continue to the system prompt.
function isBackgroundLocationDisclosureAccepted(): Promise<boolean> {
  const promise = new Promise<boolean>((resolve) => {
    Alert.alert(
      "Background Location Access",
      "Memory Journal uses your location in the background to notice when you've arrived somewhere new or been resting, so it can prompt you to save a memory — even when the app isn't open. Location data stays on your device.",
      [
        { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
        { text: "Continue", onPress: () => resolve(true) },
      ],
    );
  });
  return promise;
}

export const startLocationTracking = async () => {
  try {
    // Check if already tracking
    const alreadyTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    logInfo(
      `🔍 Task registration check: ${alreadyTracking ? "ALREADY ACTIVE" : "NOT ACTIVE"}`,
    );

    if (alreadyTracking) {
      logInfo("⚠️  Location tracking already active, stopping first...");
      await stopLocationTracking();
      // Add small delay to ensure clean restart
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Request notification permission (skipped only in Expo Go)
    if (isSendNotificationsEnabled()) {
      try {
        const Notifications = await getNotificationsModule();
        if (Platform.OS === "android") {
          // Android 8+ requires a channel; create it before requesting
          // permission so the Android 13+ prompt can be shown
          await Notifications.setNotificationChannelAsync("default", {
            name: "Break reminders",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "app_notification.mp3",
          });
          await Notifications.setNotificationChannelAsync(
            STATUS_NOTIFICATION_CHANNEL_ID,
            {
              name: "Tracking status",
              importance: Notifications.AndroidImportance.DEFAULT,
              sound: null,
            },
          );
        }
        await Notifications.requestPermissionsAsync();
      } catch (notifError) {
        logWarn(
          "⚠️  Notification permission request failed (non-blocking):",
          notifError,
        );
      }
    }

    const isAlreadyGranted = await isBackgroundLocationPermissionGranted();
    if (!isAlreadyGranted) {
      const didUserContinue = await isBackgroundLocationDisclosureAccepted();
      if (!didUserContinue) {
        throw new Error("User declined background location disclosure");
      }
    }

    // Request both foreground and background location permissions
    const fgStatus = await Location.requestForegroundPermissionsAsync();
    logInfo(`📍 Foreground location permission: ${fgStatus.status}`);
    if (fgStatus.status !== "granted") {
      throw new Error("Foreground location permission not granted");
    }

    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    logInfo(`📍 Background location permission: ${bgStatus.status}`);
    if (bgStatus.status !== "granted") {
      throw new Error("Background location permission not granted");
    }

    logInfo(`✅ All location permissions granted`);

    // Read fetch frequency from database (in seconds, convert to ms)
    const userId = await getUserIdFromStorage();
    if (!userId) {
      throw new Error("Could not determine user ID for location tracking");
    }

    const settings = LocationSettingsStore.getLocationSettings(userId);
    const fetchFrequencySeconds = settings.fetchFrequency;
    const fetchFrequencyMs = fetchFrequencySeconds * 1000;

    logInfo(
      `▶️  Starting location tracking: fetchFrequency=${fetchFrequencySeconds}s (${fetchFrequencyMs}ms)`,
    );

    // Start location updates with user-configured frequency.
    // distanceInterval must stay 0: a positive value suppresses updates until
    // the device has moved that far, which breaks time-based updates and the
    // rest-period detection (no updates arrive while the user is resting)
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // Balanced (not High) so the fused provider can fall back to Wi-Fi/cell
      // positioning indoors; High is GPS-primary and delivers no fixes without
      // sky view, which silently stops the background task indoors.
      accuracy: Location.Accuracy.Balanced,
      timeInterval: fetchFrequencyMs,
      distanceInterval: 0,
      mayShowUserSettingsDialog: true,
      // iOS: show the status-bar indicator while tracking in the background
      showsBackgroundLocationIndicator: true,
      // Android: background location only keeps running inside a foreground
      // service, which requires a persistent notification
      foregroundService: {
        notificationTitle: "Journal is tracking your walk",
        notificationBody:
          "Location is used to remind you to journal when you take a break.",
        // Accent color for the notification icon/background; matches the
        // brand color used for expo-notifications in app.json. Doesn't fix
        // the icon shape itself — that's still applicationInfo.icon inside
        // expo-location's native code, unreachable without a patch.
        notificationColor: "#7A5236",
      },
    });

    logInfo(`✅ Location.startLocationUpdatesAsync() completed`);

    // Post the live-status notification immediately instead of waiting for
    // the first background task cycle (which can be up to fetchFrequency
    // seconds away).
    await updateLiveStatusNotification(
      "Just started — gathering your location.",
    );

    const isNowTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    logInfo(
      `✅ Location tracking status verified: ${isNowTracking ? "✓ ACTIVE" : "✗ NOT ACTIVE"}`,
    );

    if (!isNowTracking) {
      logError("❌ WARNING: Tracking was not registered after start!");
    }
  } catch (error) {
    logError("❌ Error starting location tracking:", error);
    throw error;
  }
};

export const stopLocationTracking = async () => {
  try {
    logInfo(`⏸️  Attempting to stop location tracking...`);
    const isTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      logInfo(`📍 Task is registered, stopping...`);
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      logInfo("🛑 Location tracking stopped");
    } else {
      logInfo("⚠️  Location tracking was not active");
    }
  } catch (error) {
    logError("❌ Error stopping location tracking:", error);
    throw error;
  }
};

export const isLocationTrackingActive = async (): Promise<boolean> => {
  try {
    const isTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isTracking;
  } catch (error) {
    logError("Error checking location tracking status:", error);
    return false;
  }
};

// ===== HELPER: GET USER ID FROM STORAGE =====

const getUserIdFromStorage = async (): Promise<number | null> => {
  try {
    // Retrieve username from SecureStore (stored on successful login)
    const username = await SecureStore.getItemAsync("currentUsername");
    if (!username) {
      logWarn("No username found in SecureStore");
      return null;
    }

    // Get userId from database using username
    const userId = UserTable.getUserIdByUsername(username);
    return userId;
  } catch (error) {
    logError("Error getting user ID from storage:", error);
    return null;
  }
};
