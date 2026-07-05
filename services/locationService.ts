import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { getDistance } from "geolib";
import { getUserIdByUsername, insertLocation } from "./database";

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

// Store last known location for distance calculation
let lastLocation: { latitude: number; longitude: number } | null = null;

// ===== BACKGROUND TASK REGISTRATION =====

// Register background location task (runs every minute in foreground and background)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Location tracking error:", error);
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
        if (userId) {
          insertLocation(
            userId,
            location.coords.latitude,
            location.coords.longitude,
            location.coords.altitude,
          );
          console.log("Location saved:", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
            userId: userId,
          });

          // Calculate distance from last location
          if (lastLocation) {
            const distance = getDistance(
              {
                latitude: lastLocation.latitude,
                longitude: lastLocation.longitude,
              },
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
            );

            // Only consider movement if distance exceeds GPS accuracy (filter out noise)
            const gpsAccuracy = location.coords.accuracy || 10; // Default 10m if unavailable
            if (distance > gpsAccuracy) {
              if (SEND_NOTIFICATIONS) {
                // Production: Send notification
                try {
                  const Notifications = await getNotificationsModule();
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Location Updated",
                      body: `Moved ${distance.toFixed(1)}m • Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)}`,
                    },
                    trigger: null,
                  });
                } catch (notifError) {
                  console.warn(
                    "Could not send notification from background task:",
                    notifError,
                  );
                }
              } else {
                // Development: Log distance
                console.log(
                  `📍 Distance moved: ${distance.toFixed(2)}m (accuracy: ${gpsAccuracy.toFixed(1)}m)`,
                );
              }

              // Update last known location
              lastLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
            } else {
              // GPS noise detected, don't update position
              console.log(
                `📍 GPS noise: ${distance.toFixed(2)}m (within accuracy: ${gpsAccuracy.toFixed(1)}m)`,
              );
            }
          } else {
            // First location, just store it
            lastLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
          }
        }
      } catch (error) {
        console.error("Error saving location:", error);
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
          "Notification permission request failed (non-blocking):",
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

    // Start location updates (every 1+ meter movement or every 10 seconds)
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // Every 10 seconds
      distanceInterval: 1, // Trigger on 1+ meter movement
    });

    console.log("Location tracking started");
  } catch (error) {
    console.error("Error starting location tracking:", error);
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
