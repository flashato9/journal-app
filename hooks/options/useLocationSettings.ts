import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  createLocationSettings,
  getLocationSettingsByUserId,
  getUserIdByUsername,
  updateLocationSettings,
} from "@/services/database";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationService";

// Custom hook that owns the location settings screen: loading the
// current user's settings (creating defaults if none exist), form
// state, and saving (DB update, AuthContext sync, tracking restart).
export function useLocationSettings() {
  const router = useRouter();
  const { username } = useLocalSearchParams();
  const { setLocationSettings } = useContext(AuthContext);

  const [fetchFrequency, setFetchFrequency] = useState("10");
  const [distanceThreshold, setDistanceThreshold] = useState("1");
  const [restSeconds, setRestSeconds] = useState("10");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!username) {
          console.warn("No username provided");
          setLoading(false);
          return;
        }

        const userId = getUserIdByUsername(username as string);
        if (!userId) {
          console.warn("Could not find user ID");
          setLoading(false);
          return;
        }

        let settings = getLocationSettingsByUserId(userId);

        // If settings don't exist, create dummy settings
        if (!settings) {
          console.log("Creating default location settings");
          createLocationSettings(userId, 10, 1, 10);
          settings = getLocationSettingsByUserId(userId);
        }

        if (settings) {
          setFetchFrequency(settings.fetchFrequency.toString());
          setDistanceThreshold(settings.notificationThreshold.toString());
          setRestSeconds(settings.restThreshold.toString());
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading location settings:", error);
        setLoading(false);
      }
    };

    loadSettings();
  }, [username]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (!username) {
        console.warn("No username provided");
        setIsSaving(false);
        return;
      }

      const userId = getUserIdByUsername(username as string);
      if (!userId) {
        console.warn("Could not find user ID");
        setIsSaving(false);
        return;
      }

      const fetchFreq = parseInt(fetchFrequency) || 10;
      const distThreshold = parseFloat(distanceThreshold) || 1;
      const restThresh = parseInt(restSeconds) || 10;

      // Update database
      updateLocationSettings(userId, fetchFreq, distThreshold, restThresh);
      console.log("📍 Location settings saved to database:", {
        fetchFreq,
        distThreshold,
        restThresh,
      });

      // Update AuthContext
      setLocationSettings({
        fetchFrequency: fetchFreq,
        notificationThreshold: distThreshold,
        restThreshold: restThresh,
      });

      // Stop and restart location tracking with new settings
      await stopLocationTracking();
      await startLocationTracking();
      console.log("✅ Location tracking restarted with new settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error saving location settings:", error);
      setIsSaving(false);
    }
  };

  return {
    fetchFrequency,
    setFetchFrequency,
    distanceThreshold,
    setDistanceThreshold,
    restSeconds,
    setRestSeconds,
    saved,
    loading,
    isSaving,
    saveSettings,
  };
}
