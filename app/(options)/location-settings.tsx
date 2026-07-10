import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLocationSettings } from "@/hooks/options/useLocationSettings";

export default function LocationSettingsScreen() {
  const {
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
  } = useLocationSettings();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Location Settings" />
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Loading settings..." />
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
