import { MaterialIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRecordAudioModal } from "@/hooks/memories/useRecordAudioModal";
import { formatDuration } from "./formatDuration";

interface RecordAudioModalProps {
  visible: boolean;
  onRecorded: (uri: string) => void;
  onClose: () => void;
}

export default function RecordAudioModal({
  visible,
  onRecorded,
  onClose,
}: RecordAudioModalProps) {
  const recordAudioModalOptions = { visible, onRecorded, onClose };
  const {
    recorderState,
    isPreparing,
    isRecording,
    handleStart,
    handleStop,
    handleCancel,
  } = useRecordAudioModal(recordAudioModalOptions);

  const content = (
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
  return content;
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
