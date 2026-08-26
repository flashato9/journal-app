import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { logError, logInfo, logWarn } from "@/services/appLogger";
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
  const [locationFetchTimeout, setLocationFetchTimeout] = useState("20");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!username) {
          logWarn("No username provided");
          setLoading(false);
          return;
        }

        const userId = UserTable.getUserIdByUsername(username);
        if (!userId) {
          logWarn("Could not find user ID");
          setLoading(false);
          return;
        }

        let settings =
          LocationSettingsTable.getLocationSettingsByUserId(userId);

        // If settings don't exist, create dummy settings
        if (!settings) {
          logInfo("Creating default location settings");
          LocationSettingsTable.createLocationSettings(userId, 10, 1, 10);
          settings = LocationSettingsTable.getLocationSettingsByUserId(userId);
        }

        if (settings) {
          setFetchFrequency(settings.fetchFrequency.toString());
          setDistanceThreshold(settings.notificationThreshold.toString());
          setRestSeconds(settings.restThreshold.toString());
          setPollFrequency(settings.locationTrackingPollFrequency.toString());
          setLocationFetchTimeout(settings.locationFetchTimeout.toString());
        }

        setLoading(false);
      } catch (error) {
        logError("Error loading location settings:", error);
        setLoading(false);
      }
    };

    loadSettings();
  }, [username]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (!username) {
        logWarn("No username provided");
        setIsSaving(false);
        return;
      }

      const userId = UserTable.getUserIdByUsername(username);
      if (!userId) {
        logWarn("Could not find user ID");
        setIsSaving(false);
        return;
      }

      const fetchFreq = parseInt(fetchFrequency) || 10;
      const distThreshold = parseFloat(distanceThreshold) || 1;
      const restThresh = parseInt(restSeconds) || 10;
      const pollFreq = parseInt(pollFrequency) || 15;
      const fetchTimeout = parseInt(locationFetchTimeout) || 20;

      // Update database
      LocationSettingsTable.updateLocationSettings(
        userId,
        fetchFreq,
        distThreshold,
        restThresh,
        pollFreq,
        fetchTimeout,
      );
      logInfo("📍 Location settings saved to database:", {
        fetchFreq,
        distThreshold,
        restThresh,
        pollFreq,
        fetchTimeout,
      });

      // Update AuthContext
      setLocationSettings({
        fetchFrequency: fetchFreq,
        notificationThreshold: distThreshold,
        restThreshold: restThresh,
        locationTrackingPollFrequency: pollFreq,
        locationFetchTimeout: fetchTimeout,
      });

      // Stop and restart location tracking with new settings
      await stopLocationTracking();
      await startLocationTracking();
      logInfo("✅ Location tracking restarted with new settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      logError("Error saving location settings:", error);
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
    locationFetchTimeout,
    setLocationFetchTimeout,
    saved,
    loading,
    isSaving,
    saveSettings,
  };
}
