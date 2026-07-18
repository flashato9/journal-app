import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LocationSettingsTable, UserTable } from "@/services/database";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationService";

// Custom hook that owns the location settings section: loading the
// current user's settings (creating defaults if none exist), form
// state, and saving (DB update, AuthContext sync, tracking restart).
export function useLocationSettings() {
  const { username, setLocationSettings } = useContext(AuthContext);

  const [fetchFrequency, setFetchFrequency] = useState("10");
  const [distanceThreshold, setDistanceThreshold] = useState("1");
  const [restSeconds, setRestSeconds] = useState("10");
  const [pollFrequency, setPollFrequency] = useState("15");
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

        const userId = UserTable.getUserIdByUsername(username);
        if (!userId) {
          console.warn("Could not find user ID");
          setLoading(false);
          return;
        }

        let settings =
          LocationSettingsTable.getLocationSettingsByUserId(userId);

        // If settings don't exist, create dummy settings
        if (!settings) {
          console.log("Creating default location settings");
          LocationSettingsTable.createLocationSettings(userId, 10, 1, 10);
          settings = LocationSettingsTable.getLocationSettingsByUserId(userId);
        }

        if (settings) {
          setFetchFrequency(settings.fetchFrequency.toString());
          setDistanceThreshold(settings.notificationThreshold.toString());
          setRestSeconds(settings.restThreshold.toString());
          setPollFrequency(settings.locationTrackingPollFrequency.toString());
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

      const userId = UserTable.getUserIdByUsername(username);
      if (!userId) {
        console.warn("Could not find user ID");
        setIsSaving(false);
        return;
      }

      const fetchFreq = parseInt(fetchFrequency) || 10;
      const distThreshold = parseFloat(distanceThreshold) || 1;
      const restThresh = parseInt(restSeconds) || 10;
      const pollFreq = parseInt(pollFrequency) || 15;

      // Update database
      LocationSettingsTable.updateLocationSettings(
        userId,
        fetchFreq,
        distThreshold,
        restThresh,
        pollFreq,
      );
      console.log("📍 Location settings saved to database:", {
        fetchFreq,
        distThreshold,
        restThresh,
        pollFreq,
      });

      // Update AuthContext
      setLocationSettings({
        fetchFrequency: fetchFreq,
        notificationThreshold: distThreshold,
        restThreshold: restThresh,
        locationTrackingPollFrequency: pollFreq,
      });

      // Stop and restart location tracking with new settings
      await stopLocationTracking();
      await startLocationTracking();
      console.log("✅ Location tracking restarted with new settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving location settings:", error);
    } finally {
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
    pollFrequency,
    setPollFrequency,
    saved,
    loading,
    isSaving,
    saveSettings,
  };
}
