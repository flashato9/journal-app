import { MaterialIcons } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDuration } from "./formatDuration";

interface RecordAudioModalProps {
  visible: boolean;
  // Called with the recorder's temporary file URI once a recording is stopped.
  // The caller is responsible for persisting it.
  onRecorded: (uri: string) => void;
  onClose: () => void;
}

export default function RecordAudioModal({
  visible,
  onRecorded,
  onClose,
}: RecordAudioModalProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isPreparing, setIsPreparing] = useState(false);

  const isRecording = recorderState.isRecording;

  // Stop without handing the recording back — used by cancel and by unmount, so
  // an abandoned recorder never keeps the mic open.
  const discard = useCallback(async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch (error) {
      console.warn("Failed to stop recorder while discarding:", error);
    }
  }, [recorder]);

  // Ask for the mic up front: if it's denied there's nothing to show, so close.
  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const prepare = async () => {
      setIsPreparing(true);
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          Alert.alert(
            "Permission denied",
            "Microphone access is required to record a sound",
          );
          onClose();
          return;
        }

        // Required on iOS for the recorder to capture at all.
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
      } catch (error) {
        if (cancelled) return;
        console.error("Error preparing recorder:", error);
        Alert.alert("Error", "Failed to start the recorder");
        onClose();
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [visible, recorder, onClose]);

  const handleStart = () => {
    try {
      recorder.record();
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const handleStop = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        throw new Error("Recorder produced no file");
      }
      onRecorded(uri);
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to save recording");
      onClose();
    }
  };

  const handleCancel = async () => {
    await discard();
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Record Sound</Text>

          <Text style={styles.timer}>
            {formatDuration(recorderState.durationMillis / 1000)}
          </Text>

          <Text style={styles.hint}>
            {isPreparing
              ? "Preparing microphone..."
              : isRecording
                ? "Recording... tap to stop"
                : "Tap the microphone to start"}
          </Text>

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.stopButton]}
            onPress={isRecording ? handleStop : handleStart}
            disabled={isPreparing}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isRecording ? "stop" : "mic"}
              size={36}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  timer: {
    fontSize: 40,
    fontWeight: "300",
    color: "#000",
    fontVariant: ["tabular-nums"],
    marginTop: 16,
  },
  hint: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 24,
  },
  recordButton: {
    backgroundColor: "#007AFF",
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
});
