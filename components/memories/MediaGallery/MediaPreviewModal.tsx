import { MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useImageZoomGesture } from "@/hooks/memories/useImageZoomGesture";
import type { MediaType } from "@/services/mediaStorage";
import { formatDuration } from "./formatDuration";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface MediaPreviewModalProps {
  visible: boolean;
  uri: string | null;
  type?: MediaType;
  onClose: () => void;
}

export default function MediaPreviewModal({
  visible,
  uri,
  type = "image",
  onClose,
}: MediaPreviewModalProps) {
  const { gesture, animatedStyle, reset } = useImageZoomGesture();

  // Start every image fresh at 1x zoom, centered.
  useEffect(() => {
    if (visible) reset();
  }, [visible, uri, reset]);

  if (!uri) return null;

  const renderMedia = () => {
    if (type === "video") {
      return <VideoPreview uri={uri} />;
    }
    if (type === "audio") {
      return <AudioPreview uri={uri} />;
    }
    return (
      <GestureDetector gesture={gesture}>
        <AnimatedImage
          source={{ uri }}
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    );
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          {/* Sits behind the media; tapping anywhere outside it closes the modal */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          {renderMedia()}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.6}
        >
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Pinch/pan doesn't apply to video playback, so this skips
// useImageZoomGesture entirely and just plays with native controls.
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.image}
      contentFit="contain"
      nativeControls
    />
  );
}

// Audio has nothing to show and nothing to zoom, so it gets its own transport:
// a play/pause toggle, elapsed/total time, and a progress bar.
function AudioPreview({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const progress =
    status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  const handleToggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // Replay from the start once the clip has run to the end.
    if (status.didJustFinish || status.currentTime >= status.duration) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <View style={styles.audioContainer}>
      <MaterialIcons name="graphic-eq" size={64} color="#fff" />

      <TouchableOpacity
        style={styles.playButton}
        onPress={handleToggle}
        disabled={!status.isLoaded}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={status.playing ? "pause" : "play-arrow"}
          size={40}
          color="#fff"
        />
      </TouchableOpacity>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.audioTime}>
        {status.isLoaded
          ? `${formatDuration(status.currentTime)} / ${formatDuration(status.duration)}`
          : "Loading..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  audioContainer: {
    alignItems: "center",
    width: "78%",
    gap: 20,
  },
  playButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  audioTime: {
    color: "#fff",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
