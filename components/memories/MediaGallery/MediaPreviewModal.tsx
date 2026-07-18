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
  type ViewStyle,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useZoomGesture } from "react-native-zoom-reanimated";
import type { MediaType } from "@/services/mediaStorage";
import { formatDuration } from "./formatDuration";

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
  const zoomGestureOptions = { minScale: 1 };
  const {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
  } = useZoomGesture(zoomGestureOptions);

  // Start every image fresh at 1x zoom, centered.
  useEffect(() => {
    if (visible) zoomOut();
  }, [visible, uri, zoomOut]);

  if (!uri) return null;

  // The image branch casts contentContainerAnimatedStyle to ViewStyle since react-native-zoom-reanimated's useAnimatedStyle return type is untyped.
  const renderMedia = () => {
    let media: React.ReactNode;
    if (type === "video") {
      media = <VideoPreview uri={uri} />;
    } else if (type === "audio") {
      media = <AudioPreview uri={uri} />;
    } else {
      media = (
        <View style={styles.image} onLayout={onLayout}>
          <GestureDetector gesture={zoomGesture}>
            <Animated.View
              style={contentContainerAnimatedStyle as unknown as ViewStyle}
              onLayout={onLayoutContent}
            >
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      );
    }
    return media;
  };

  const content = (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
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
  return content;
}

// Video playback doesn't support pinch/pan, so this skips useZoomGesture and plays with native controls.
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.play();
  });

  const content = (
    <VideoView
      player={player}
      style={styles.image}
      contentFit="contain"
      nativeControls
    />
  );
  return content;
}

// Audio has nothing to show or zoom, so it gets a play/pause toggle, elapsed/total time, and a progress bar.
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
    if (status.didJustFinish || status.currentTime >= status.duration) {
      player.seekTo(0);
    }
    player.play();
  };

  const progressFillStyle: ViewStyle = { width: `${progress}%` };

  const content = (
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
        <View style={[styles.progressFill, progressFillStyle]} />
      </View>

      <Text style={styles.audioTime}>
        {status.isLoaded
          ? `${formatDuration(status.currentTime)} / ${formatDuration(status.duration)}`
          : "Loading..."}
      </Text>
    </View>
  );
  return content;
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
