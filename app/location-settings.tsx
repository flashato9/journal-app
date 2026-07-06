import { View, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import Header from "./components/Header";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const DEFAULT_FETCH_FREQUENCY = "10000"; // milliseconds
const DEFAULT_DISTANCE_THRESHOLD = "1"; // meters
const DEFAULT_REST_SECONDS = "60"; // seconds

export default function LocationSettingsScreen() {
  const [fetchFrequency, setFetchFrequency] = useState(DEFAULT_FETCH_FREQUENCY);
  const [distanceThreshold, setDistanceThreshold] =
    useState(DEFAULT_DISTANCE_THRESHOLD);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const frequency = await SecureStore.getItemAsync(
        "locationFetchFrequency",
      );
      const distance = await SecureStore.getItemAsync(
        "locationDistanceThreshold",
      );
      const rest = await SecureStore.getItemAsync("locationRestSeconds");

      if (frequency) setFetchFrequency(frequency);
      if (distance) setDistanceThreshold(distance);
      if (rest) setRestSeconds(rest);
    } catch (error) {
      console.error("Error loading location settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      await SecureStore.setItemAsync(
        "locationFetchFrequency",
        fetchFrequency,
      );
      await SecureStore.setItemAsync(
        "locationDistanceThreshold",
        distanceThreshold,
      );
      await SecureStore.setItemAsync("locationRestSeconds", restSeconds);

      console.log("📍 Location settings saved:", {
        fetchFrequency,
        distanceThreshold,
        restSeconds,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving location settings:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Location Settings" />

      <View style={styles.content}>
        {/* Fetch Frequency */}
        <View style={styles.setting}>
          <Text style={styles.label}>Fetch Frequency (ms)</Text>
          <TextInput
            style={styles.input}
            value={fetchFrequency}
            onChangeText={setFetchFrequency}
            placeholder="Enter milliseconds"
            keyboardType="number-pad"
          />
          <Text style={styles.description}>
            How often to check for location updates (1000 = 1 second)
          </Text>
        </View>

        {/* Distance Threshold */}
        <View style={styles.setting}>
          <Text style={styles.label}>Distance Threshold (meters)</Text>
          <TextInput
            style={styles.input}
            value={distanceThreshold}
            onChangeText={setDistanceThreshold}
            placeholder="Enter meters"
            keyboardType="decimal-pad"
          />
          <Text style={styles.description}>
            Minimum distance to move before recording a new location
          </Text>
        </View>

        {/* Rest Seconds */}
        <View style={styles.setting}>
          <Text style={styles.label}>Rest Seconds</Text>
          <TextInput
            style={styles.input}
            value={restSeconds}
            onChangeText={setRestSeconds}
            placeholder="Enter seconds"
            keyboardType="number-pad"
          />
          <Text style={styles.description}>
            Time interval for background location checks
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saved && styles.savedButton]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>
            {saved ? "✅ Saved" : "💾 Save Settings"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  savedButton: {
    backgroundColor: "#34C759",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
