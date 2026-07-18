import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioRecorder,
} from "expo-audio";

interface UseRecordAudioModalOptions {
  visible: boolean;
  onRecorded: (uri: string) => void;
  onClose: () => void;
}

// Stops the recorder without delivering it, so an abandoned recording never keeps the mic open.
async function discardRecording(recorder: AudioRecorder) {
  try {
    if (recorder.getStatus().canRecord) {
      await recorder.stop();
    }
  } catch (error) {
    console.warn("Failed to stop recorder while discarding:", error);
  }
}

async function prepareRecorder(
  recorder: AudioRecorder,
  onClose: () => void,
  setIsPreparing: (value: boolean) => void,
  isCancelled: () => boolean,
) {
  setIsPreparing(true);
  try {
    const permission = await requestRecordingPermissionsAsync();
    if (isCancelled()) return;
    if (!permission.granted) {
      Alert.alert(
        "Permission denied",
        "Microphone access is required to record a sound",
      );
      onClose();
      return;
    }

    const recordingAudioMode = {
      allowsRecording: true,
      playsInSilentMode: true,
    };
    await setAudioModeAsync(recordingAudioMode);
    await recorder.prepareToRecordAsync();
    if (isCancelled()) {
      await discardRecording(recorder);
      return;
    }
  } catch (error) {
    if (isCancelled()) return;
    console.error("Error preparing recorder:", error);
    Alert.alert("Error", "Failed to start the recorder");
    onClose();
  } finally {
    if (!isCancelled()) setIsPreparing(false);
  }
}

async function stopAndDeliverRecording(
  recorder: AudioRecorder,
  onRecorded: (uri: string) => void,
  onClose: () => void,
) {
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
}

export function useRecordAudioModal({
  visible,
  onRecorded,
  onClose,
}: UseRecordAudioModalOptions) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isPreparing, setIsPreparing] = useState(false);
  const isRecording = recorderState.isRecording;

  const discard = useCallback(async () => {
    await discardRecording(recorder);
  }, [recorder]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const isCancelled = () => cancelled;
    prepareRecorder(recorder, onClose, setIsPreparing, isCancelled);
    const cleanup = () => {
      cancelled = true;
    };
    return cleanup;
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
    await stopAndDeliverRecording(recorder, onRecorded, onClose);
  };

  const handleCancel = async () => {
    await discard();
    onClose();
  };

  return {
    recorderState,
    isPreparing,
    isRecording,
    handleStart,
    handleStop,
    handleCancel,
  };
}
