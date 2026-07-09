import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import Header from "@/components/Header";

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams();
  const { setLocationSettings } = useContext(AuthContext);

  const [fetchFrequency, setFetchFrequency] = useState("10");
  const [distanceThreshold, setDistanceThreshold] = useState("1");
  const [restSeconds, setRestSeconds] = useState("10");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
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
  }, [username]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Location Settings" />
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Location Settings" />

      <View style={styles.content}>
        {/* Fetch Frequency */}
        <View style={styles.setting}>
          <Text style={styles.label}>Fetch Frequency (seconds)</Text>
          <TextInput
            style={styles.input}
            value={fetchFrequency}
            onChangeText={setFetchFrequency}
            placeholder="Enter seconds"
            keyboardType="number-pad"
          />
          <Text style={styles.description}>
            How often to check and log location to database. Location is always
            recorded.
          </Text>
        </View>

        {/* Notification Threshold */}
        <View style={styles.setting}>
          <Text style={styles.label}>Notification Threshold (meters)</Text>
          <TextInput
            style={styles.input}
            value={distanceThreshold}
            onChangeText={setDistanceThreshold}
            placeholder="Enter meters"
            keyboardType="decimal-pad"
          />
          <Text style={styles.description}>
            Minimum distance to move before sending a notification. Locations
            are always recorded in database.
          </Text>
        </View>

        {/* Rest Threshold */}
        <View style={styles.setting}>
          <Text style={styles.label}>Rest Threshold (seconds)</Text>
          <TextInput
            style={styles.input}
            value={restSeconds}
            onChangeText={setRestSeconds}
            placeholder="Enter seconds"
            keyboardType="number-pad"
          />
          <Text style={styles.description}>
            How long to wait since last location before sending a notification
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saved && styles.savedButton,
            isSaving && styles.savingButton,
          ]}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {saved ? "✅ Saved" : "💾 Save Settings"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  setting: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  savingButton: {
    backgroundColor: "#0051D5",
    opacity: 0.8,
  },
  savedButton: {
    backgroundColor: "#34C759",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
