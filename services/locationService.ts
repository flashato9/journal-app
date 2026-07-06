import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { getDistance } from "geolib";
import {
  getUserIdByUsername,
  insertLocation,
  getLatestLocation,
  getLatestTimeMemoryWithLocation,
  insertNotification,
  getLatestNotification,
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

// ===== BACKGROUND TASK REGISTRATION =====

// Register background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Location tracking error:", error);
    return;
  }

  if (data) {
    const { locations } = data as {
      locations: Location.LocationObject[];
    };
    const location = locations[0];

    if (location) {
      try {
        const userId = await getUserIdFromStorage();
        if (!userId) {
          console.warn("❌ No user ID found");
          return;
        }

        const currentLat = location.coords.latitude;
        const currentLon = location.coords.longitude;
        const currentAlt = location.coords.altitude;

        console.log(`📍 Location check at ${new Date().toISOString()}`);

        // ===== STAGE 1: Distance Filter (1m threshold) =====
        const latestDbLocation = getLatestLocation(userId);
        if (latestDbLocation) {
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
            return;
          }
        }

        // Record new location
        insertLocation(userId, currentLat, currentLon, currentAlt);
        console.log(`✅ Location recorded: ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`);

        // ===== STAGE 2: Notification Threshold Check =====
        const latestMemory = getLatestTimeMemoryWithLocation(userId);
        if (!latestMemory || !latestMemory.latitude || !latestMemory.longitude) {
          console.log(
            `⏭️  No previous memory with location, skipping notification check`,
          );
          return;
        }

        const distanceFromMemory = getDistance(
          {
            latitude: latestMemory.latitude,
            longitude: latestMemory.longitude,
          },
          { latitude: currentLat, longitude: currentLon },
        );

        // Get notification threshold from SecureStore
        const notificationThresholdStr =
          await SecureStore.getItemAsync("locationDistanceThreshold");
        const notificationThreshold = notificationThresholdStr
          ? parseFloat(notificationThresholdStr)
          : 1;

        if (distanceFromMemory <= notificationThreshold) {
          console.log(
            `⏭️  Distance ${distanceFromMemory.toFixed(2)}m <= threshold ${notificationThreshold}m, no notification`,
          );
          return;
        }

        console.log(
          `⚠️  Distance ${distanceFromMemory.toFixed(2)}m > threshold ${notificationThreshold}m, checking rest period`,
        );

        // ===== STAGE 3: Rest Period + Duplicate Prevention =====
        const restSecondsStr = await SecureStore.getItemAsync(
          "locationRestSeconds",
        );
        const restSeconds = restSecondsStr ? parseInt(restSecondsStr) : 10;

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

        if (timeSinceLastLocation <= restSeconds) {
          console.log(
            `⏭️  Only ${timeSinceLastLocation.toFixed(1)}s passed < ${restSeconds}s rest period`,
          );
          return;
        }

        console.log(
          `✓ ${timeSinceLastLocation.toFixed(1)}s > ${restSeconds}s rest period, ready to notify`,
        );

        // Build notification message
        const notificationMessage = `Hey we noticed you're on a break and you have traveled more than ${notificationThreshold} meters since your last memory. Exactly - ${distanceFromMemory.toFixed(1)} meters.`;

        // Check for duplicate notification within 5 minutes
        const latestNotification = getLatestNotification(
          userId,
          notificationMessage,
        );
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
      } catch (error) {
        console.error("❌ Error in location task:", error);
      }
    }
  }
});

// ===== LOCATION TRACKING =====

export const startLocationTracking = async () => {
  try {
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
    if (fgStatus.status !== "granted") {
      throw new Error("Foreground location permission not granted");
    }

    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      throw new Error("Background location permission not granted");
    }

    // Read fetch frequency from SecureStore (in seconds, convert to ms)
    const fetchFrequencyStr =
      await SecureStore.getItemAsync("locationFetchFrequency");
    const fetchFrequencySeconds = fetchFrequencyStr
      ? parseInt(fetchFrequencyStr)
      : 10;
    const fetchFrequencyMs = fetchFrequencySeconds * 1000;

    console.log(
      `📍 Starting location tracking with ${fetchFrequencySeconds}s fetch frequency`,
    );

    // Start location updates with user-configured frequency
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: fetchFrequencyMs,
      distanceInterval: 1, // Trigger on 1+ meter movement (will be filtered in Stage 1)
    });

    console.log("✅ Location tracking started");
  } catch (error) {
    console.error("❌ Error starting location tracking:", error);
    throw error;
  }
};

export const stopLocationTracking = async () => {
  try {
    const isTracking =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("Location tracking stopped");
    }
  } catch (error) {
    console.error("Error stopping location tracking:", error);
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
