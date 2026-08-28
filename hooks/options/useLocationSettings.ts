import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { logError, logInfo, logWarn } from "@/services/appLogger";
import { UserTable } from "@/services/database";
import * as LocationSettingsStore from "@/services/locationSettingsStore";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationService";

// Owns the location settings section: loading, form state, and saving.
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

        const settings = LocationSettingsStore.getLocationSettings(userId);
        setFetchFrequency(settings.fetchFrequency.toString());
        setDistanceThreshold(settings.notificationThreshold.toString());
        setRestSeconds(settings.restThreshold.toString());
        setPollFrequency(settings.locationTrackingPollFrequency.toString());
        setLocationFetchTimeout(settings.locationFetchTimeout.toString());

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

      const updatedSettings = {
        fetchFrequency: parseInt(fetchFrequency) || 10,
        notificationThreshold: parseFloat(distanceThreshold) || 1,
        restThreshold: parseInt(restSeconds) || 10,
        locationTrackingPollFrequency: parseInt(pollFrequency) || 15,
        locationFetchTimeout: parseInt(locationFetchTimeout) || 20,
      };

      LocationSettingsStore.saveLocationSettings(userId, updatedSettings);
      logInfo("📍 Location settings saved to database:", updatedSettings);

      setLocationSettings(updatedSettings);

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
