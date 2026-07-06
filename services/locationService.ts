import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { getDistance } from "geolib";
import {
    getLatestLocation,
    getLatestNotification,
    getLatestTimeMemoryWithLocation,
    getLocationSettingsByUserId,
    getUserIdByUsername,
    insertLocation,
    insertNotification,
} from "./database";

// Skip notifications in development mode (Expo Go doesn't support them well)
const SEND_NOTIFICATIONS = !__DEV__;

// Lazy load notifications only in production to avoid module initialization errors in Expo Go
let NotificationsModule: any = null;
const getNotificationsModule = async () => {
  if (!NotificationsModule) {
    NotificationsModule = await import("expo-notifications");
  }
  return NotificationsModule;
};

const LOCATION_TASK_NAME = "background-location-task";

// ===== HELPER: Stage 1 - Distance Filter (1m threshold) =====

const stage1DistanceFilter = (
  userId: number,
  currentLat: number,
  currentLon: number,
): boolean => {
  const latestDbLocation = getLatestLocation(userId);
  if (!latestDbLocation) {
    console.log(`📍 First location recorded`);
    return true; // No previous location, proceed to recording
  }

  const distanceFrom1mFilter = getDistance(
    {
      latitude: latestDbLocation.latitude,
      longitude: latestDbLocation.longitude,
    },
    { latitude: currentLat, longitude: currentLon },
  );

  if (distanceFrom1mFilter <= 1) {
    console.log(
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
  distanceFromMemory: number;
  threshold: number;
} => {
  const latestMemory = getLatestTimeMemoryWithLocation(userId);
  if (!latestMemory || !latestMemory.latitude || !latestMemory.longitude) {
    console.log(
      `⏭️  No previous memory with location, skipping notification check`,
    );
    return { shouldProceed: false, distanceFromMemory: 0, threshold: 0 };
  }

  const distanceFromMemory = getDistance(
    {
      latitude: latestMemory.latitude,
      longitude: latestMemory.longitude,
    },
    { latitude: currentLat, longitude: currentLon },
  );

  if (distanceFromMemory <= notificationThreshold) {
    console.log(
      `⏭️  Distance ${distanceFromMemory.toFixed(2)}m <= threshold ${notificationThreshold}m, no notification`,
    );
    return {
      shouldProceed: false,
      distanceFromMemory,
      threshold: notificationThreshold,
    };
  }

  console.log(
    `⚠️  Distance ${distanceFromMemory.toFixed(2)}m > threshold ${notificationThreshold}m, checking rest period`,
  );
  return {
    shouldProceed: true,
    distanceFromMemory,
    threshold: notificationThreshold,
  };
};

// ===== HELPER: Stage 3 - Rest Period + Duplicate Prevention =====

const stage3RestPeriodAndNotify = async (
  userId: number,
  distanceFromMemory: number,
  notificationThreshold: number,
  restThreshold: number,
): Promise<void> => {
  const latestLocationWithTime = getLatestLocation(userId);
  if (!latestLocationWithTime) {
    console.log(`⏭️  No location to check rest period`);
    return;
  }

  const lastLocationTime = new Date(
    latestLocationWithTime.createdDateTime,
  ).getTime();
  const currentTime = new Date().getTime();
  const timeSinceLastLocation = (currentTime - lastLocationTime) / 1000; // seconds

  if (timeSinceLastLocation <= restThreshold) {
    console.log(
      `⏭️  Only ${timeSinceLastLocation.toFixed(1)}s passed < ${restThreshold}s rest period`,
    );
    return;
  }

  console.log(
    `✓ ${timeSinceLastLocation.toFixed(1)}s > ${restThreshold}s rest period, ready to notify`,
  );

  // Build notification message
  const notificationMessage = `Hey we noticed you're on a break and you have traveled more than ${notificationThreshold} meters since your last memory. Exactly - ${distanceFromMemory.toFixed(1)} meters.`;

  // Check for duplicate notification within 5 minutes
  const latestNotification = getLatestNotification(userId, notificationMessage);
  if (latestNotification) {
    const notificationTime = new Date(latestNotification.createdAt).getTime();
    const timeSinceNotification = (currentTime - notificationTime) / 1000; // seconds

    if (timeSinceNotification < 300) {
      // 300 seconds = 5 minutes
      console.log(
        `🔄 Duplicate notification skipped (${timeSinceNotification.toFixed(0)}s < 5min)`,
      );
      return;
    }
  }

  // Send notification
  console.log(`📬 Sending notification: ${notificationMessage}`);
  insertNotification(userId, notificationMessage);

  if (SEND_NOTIFICATIONS) {
    try {
      const Notifications = await getNotificationsModule();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You're on a break!",
          body: notificationMessage,
        },
        trigger: null,
      });
    } catch (notifError) {
      console.warn(
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

  console.log(`\n${"=".repeat(70)}`);
  console.log(`🔵 BACKGROUND TASK INVOCATION #${invocationId} at ${timestamp}`);
  console.log(`${"=".repeat(70)}`);

  try {
    if (error) {
      console.error(`❌ [#${invocationId}] Location tracking error:`, error);
      return;
    }

    if (!data) {
      console.warn(`⚠️  [#${invocationId}] No data passed to location task`);
      return;
    }

    const { locations } = data as {
      locations: Location.LocationObject[];
    };

    if (!locations || locations.length === 0) {
      console.warn(`⚠️  [#${invocationId}] No location data in task`);
      return;
    }

    console.log(
      `✅ [#${invocationId}] Received ${locations.length} location(s)`,
    );
    const location = locations[0];
    console.log(
      `📍 [#${invocationId}] Location: lat=${location.coords.latitude.toFixed(4)}, lon=${location.coords.longitude.toFixed(4)}`,
    );

    let userId: number | null = null;
    try {
      userId = await getUserIdFromStorage();
    } catch (err) {
      console.error("❌ Failed to get user ID:", err);
      return;
    }

    if (!userId) {
      console.error("❌ No user ID found - cannot process location");
      return;
    }

    console.log(`👤 User ID: ${userId}`);

    let settings: any = null;
    try {
      settings = getLocationSettingsByUserId(userId);
    } catch (err) {
      console.error("❌ Failed to fetch location settings:", err);
      return;
    }

    if (!settings) {
      console.error("❌ No location settings found for user - cannot process");
      return;
    }

    console.log(
      `⚙️  Settings - fetchFreq: ${settings.fetchFrequency}s, notifThresh: ${settings.notificationThreshold}m, restThresh: ${settings.restThreshold}s`,
    );

    const currentLat = location.coords.latitude;
    const currentLon = location.coords.longitude;
    const currentAlt = location.coords.altitude;

    // Stage 1: Distance Filter
    let stage1Result = false;
    try {
      stage1Result = stage1DistanceFilter(userId, currentLat, currentLon);
    } catch (err) {
      console.error("❌ Error in stage 1 filter:", err);
      return;
    }

    if (!stage1Result) {
      console.log("⏭️  Stage 1 filter blocked - location too close");
      return;
    }

    // Insert location
    try {
      insertLocation(userId, currentLat, currentLon, currentAlt);
      console.log(
        `✅ Location recorded: ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`,
      );
    } catch (err) {
      console.error("❌ Failed to insert location:", err);
      return;
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
      console.error("❌ Error in stage 2 check:", err);
      return;
    }

    const { shouldProceed, distanceFromMemory, threshold } = stage2Result;

    if (!shouldProceed) {
      console.log(
        "⏭️  Stage 2 check blocked - not enough distance from memory",
      );
      return;
    }

    // Stage 3: Rest Period + Duplicate Prevention
    try {
      await stage3RestPeriodAndNotify(
        userId,
        distanceFromMemory,
        threshold,
        settings.restThreshold,
      );
    } catch (err) {
      console.error(`❌ [#${invocationId}] Error in stage 3:`, err);
    }

    console.log(`\n✅ [#${invocationId}] Task completed successfully`);
    console.log(`${"=".repeat(70)}\n`);
  } catch (error) {
    console.error(
      `❌ [#${invocationId}] CRITICAL: Unhandled error in location task:`,
      error,
    );
    if (error instanceof Error) {
      console.error(`❌ [#${invocationId}] Error stack:`, error.stack);
    }
    console.log(`${"=".repeat(70)}\n`);
  }
});

// ===== LOCATION TRACKING =====

export const startLocationTracking = async () => {
  try {
    // Check if already tracking
    const alreadyTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    console.log(
      `🔍 Task registration check: ${alreadyTracking ? "ALREADY ACTIVE" : "NOT ACTIVE"}`,
    );

    if (alreadyTracking) {
      console.log("⚠️  Location tracking already active, stopping first...");
      await stopLocationTracking();
      // Add small delay to ensure clean restart
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Request notification permission only in production
    if (SEND_NOTIFICATIONS) {
      try {
        const Notifications = await getNotificationsModule();
        await Notifications.requestPermissionsAsync();
      } catch (notifError) {
        console.warn(
          "⚠️  Notification permission request failed (non-blocking):",
          notifError,
        );
      }
    }

    // Request both foreground and background location permissions
    const fgStatus = await Location.requestForegroundPermissionsAsync();
    console.log(`📍 Foreground location permission: ${fgStatus.status}`);
    if (fgStatus.status !== "granted") {
      throw new Error("Foreground location permission not granted");
    }

    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    console.log(`📍 Background location permission: ${bgStatus.status}`);
    if (bgStatus.status !== "granted") {
      throw new Error("Background location permission not granted");
    }

    console.log(`✅ All location permissions granted`);

    // Read fetch frequency from database (in seconds, convert to ms)
    const userId = await getUserIdFromStorage();
    if (!userId) {
      throw new Error("Could not determine user ID for location tracking");
    }

    const settings = getLocationSettingsByUserId(userId);
    const fetchFrequencySeconds = settings ? settings.fetchFrequency : 10;
    const fetchFrequencyMs = fetchFrequencySeconds * 1000;

    console.log(
      `▶️  Starting location tracking: fetchFrequency=${fetchFrequencySeconds}s (${fetchFrequencyMs}ms)`,
    );

    // Start location updates with user-configured frequency
    // timeInterval: Updates at this interval (milliseconds)
    // distanceInterval: Also trigger on this much movement (meters)
    // Task fires when EITHER condition is met (whichever comes first)
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: fetchFrequencyMs,
      distanceInterval: 10,
      mayShowUserSettingsDialog: true,
    });

    console.log(`✅ Location.startLocationUpdatesAsync() completed`);

    const isNowTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    console.log(
      `✅ Location tracking status verified: ${isNowTracking ? "✓ ACTIVE" : "✗ NOT ACTIVE"}`,
    );

    if (!isNowTracking) {
      console.error("❌ WARNING: Tracking was not registered after start!");
    }
  } catch (error) {
    console.error("❌ Error starting location tracking:", error);
    throw error;
  }
};

export const stopLocationTracking = async () => {
  try {
    console.log(`⏸️  Attempting to stop location tracking...`);
    const isTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      console.log(`📍 Task is registered, stopping...`);
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("🛑 Location tracking stopped");
    } else {
      console.log("⚠️  Location tracking was not active");
    }
  } catch (error) {
    console.error("❌ Error stopping location tracking:", error);
    throw error;
  }
};

export const isLocationTrackingActive = async (): Promise<boolean> => {
  try {
    const isTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isTracking;
  } catch (error) {
    console.error("Error checking location tracking status:", error);
    return false;
  }
};

// ===== HELPER: GET USER ID FROM STORAGE =====

const getUserIdFromStorage = async (): Promise<number | null> => {
  try {
    // Retrieve username from SecureStore (stored on successful login)
    const username = await SecureStore.getItemAsync("currentUsername");
    if (!username) {
      console.warn("No username found in SecureStore");
      return null;
    }

    // Get userId from database using username
    const userId = getUserIdByUsername(username);
    return userId;
  } catch (error) {
    console.error("Error getting user ID from storage:", error);
    return null;
  }
};
