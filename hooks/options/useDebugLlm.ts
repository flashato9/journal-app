import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import {
  activateModel,
  askQuestion,
  deactivateModel,
  deleteModelFiles,
  describeImage,
  DownloadPausedError,
  DownloadState,
  downloadModel,
  getDownloadProgress,
  getDownloadState,
  pauseDownload,
  verifyModelFiles,
} from "@/services/llmService";

type ActivationStatus = "idle" | "loading" | "ready" | "error";
type ScreenDownloadState = "checking" | DownloadState;

// Custom hook that encapsulates the Debug LLM screen: managing the
// downloaded model files (start/pause/delete/check), activating the model
// (loading it into memory), asking plain-text questions, and describing a
// picked image — all via services/llmService.ts.
export function useDebugLlm() {
  const [downloadState, setDownloadState] =
    useState<ScreenDownloadState>("checking");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activationStatus, setActivationStatus] =
    useState<ActivationStatus>("idle");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState("");
  const [isDescribing, setIsDescribing] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);

  // Discovers real state on mount, purely from disk/the service's own
  // in-flight fact — this is what makes the screen show "downloading" (not
  // "paused") if you navigate back to it while a download from a previous
  // mount of this screen is still actively streaming. If it is, poll disk
  // state every second so the percentage keeps climbing and the screen
  // notices when it finishes, since we have no live hookup into that
  // orphaned download's own per-chunk callback.
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const state = await getDownloadState();
      setDownloadState(state);
      setDownloadProgress(await getDownloadProgress());

      if (state === "downloading") {
        pollInterval = setInterval(async () => {
          const polledState = await getDownloadState();
          setDownloadState(polledState);
          setDownloadProgress(await getDownloadProgress());
          if (polledState !== "downloading" && pollInterval) {
            clearInterval(pollInterval);
          }
        }, 1000);
      }
    })();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleStartDownload = async () => {
    if (downloadState === "downloading") return;

    setDownloadState("downloading");
    try {
      await downloadModel((fraction) => {
        setDownloadProgress(fraction);
        setDownloadState("downloading");
      });
      setDownloadProgress(1);
      setDownloadState("downloaded");
    } catch (error) {
      setDownloadState(await getDownloadState());
      if (error instanceof DownloadPausedError) return;
      console.error("Error downloading model:", error);
      Alert.alert("Error", "Failed to download the model. Please try again.");
    }
  };

  const handlePauseDownload = () => {
    pauseDownload();
    Alert.alert(
      "Download Paused",
      `Paused at ${Math.round(downloadProgress * 100)}%`,
    );
  };

  const handleDeleteDownload = () => {
    Alert.alert(
      "Delete Model Files",
      "This deletes the downloaded model from this device. You'll need to download it again to use it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteModelFiles();
            setDownloadState("not_started");
            setDownloadProgress(0);
            setActivationStatus("idle");
          },
        },
      ],
    );
  };

  const handleCheckDownload = async () => {
    setIsVerifying(true);
    try {
      const { model, mmproj } = await verifyModelFiles();
      if (model.isComplete && mmproj.isComplete) {
        Alert.alert(
          "Download Check",
          "Yes — both files are downloaded correctly.",
        );
        return;
      }

      const describeFile = (file: typeof model) =>
        `${file.filename}: ${
          file.exists ? `${file.localSize} bytes` : "missing"
        }${
          file.expectedSize !== null
            ? ` / ${file.expectedSize} bytes expected`
            : " (couldn't reach server to check expected size)"
        }`;

      Alert.alert(
        "Download Check",
        `No —\n${describeFile(model)}\n${describeFile(mmproj)}`,
      );
    } catch (error) {
      console.error("Error checking model files:", error);
      Alert.alert(
        "Error",
        "Failed to check the model files. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleActivateModel = async () => {
    setActivationStatus("loading");
    try {
      await activateModel();
      setActivationStatus("ready");
    } catch (error) {
      console.error("Error activating LLM:", error);
      Alert.alert("Error", "Failed to activate the model. Please try again.");
      setActivationStatus("error");
    }
  };

  const handleDeactivateModel = async () => {
    await deactivateModel();
    setActivationStatus("idle");
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      setAnswer(await askQuestion(question));
    } catch (error) {
      console.error("Error asking question:", error);
      Alert.alert("Error", "Failed to get a response. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageDescription("");
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Photo library access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageDescription("");
    }
  };

  const pickImage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Camera", "Photo Library", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickFromCamera();
          } else if (buttonIndex === 1) {
            pickFromLibrary();
          }
        },
      );
    } else {
      Alert.alert("Pick Image", "Choose an option", [
        { text: "Camera", onPress: pickFromCamera },
        { text: "Photo Library", onPress: pickFromLibrary },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleDescribeImage = async () => {
    if (!imageUri) return;

    setIsDescribing(true);
    try {
      setImageDescription(await describeImage(imageUri));
    } catch (error) {
      console.error("Error describing image:", error);
      Alert.alert("Error", "Failed to describe the image. Please try again.");
    } finally {
      setIsDescribing(false);
    }
  };

  return {
    downloadState,
    downloadProgress,
    handleStartDownload,
    handlePauseDownload,
    handleDeleteDownload,
    isVerifying,
    handleCheckDownload,
    activationStatus,
    handleActivateModel,
    handleDeactivateModel,
    question,
    setQuestion,
    answer,
    isAsking,
    handleAskQuestion,
    imageUri,
    pickImage,
    imageDescription,
    isDescribing,
    handleDescribeImage,
  };
}
