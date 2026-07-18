import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLocationSettings } from "@/hooks/options/useLocationSettings";

export default function LocationSettings() {
  const {
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
  } = useLocationSettings();

  if (loading) {
    const loadingContent = (
      <View style={styles.loadingContainer}>
        <LoadingIndicator message="Loading settings..." />
      </View>
    );
    return loadingContent;
  }

  const content = (
    <View style={styles.content}>
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
          Minimum distance to move before sending a notification. Locations are
          always recorded in database.
        </Text>
      </View>

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

      <View style={styles.setting}>
        <Text style={styles.label}>
          Location Tracking Poll Frequency (seconds)
        </Text>
        <TextInput
          style={styles.input}
          value={pollFrequency}
          onChangeText={setPollFrequency}
          placeholder="Enter seconds"
          keyboardType="number-pad"
        />
        <Text style={styles.description}>
          How often the header checks whether location tracking is currently
          active.
        </Text>
      </View>

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
  );
  return content;
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  content: {
    gap: 8,
  },
  setting: {
    marginBottom: 16,
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
    marginTop: 8,
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
