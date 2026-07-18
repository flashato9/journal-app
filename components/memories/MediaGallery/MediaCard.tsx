import { MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { MediaType } from "@/services/mediaStorage";
import { formatDuration } from "./formatDuration";

interface MediaCardProps {
  uri: string | number | ImageSourcePropType;
  type?: MediaType;
  onRemove?: () => void;
  onPress?: () => void;
}

export default function MediaCard({
  uri,
  type = "image",
  onRemove,
  onPress,
}: MediaCardProps) {
  const source = typeof uri === "string" ? { uri } : uri;

  // A require() source can only ever be an image, so it falls through to <Image>.
  const renderTile = () => {
    let tile: React.ReactNode;
    if (typeof uri === "string" && type === "video") {
      tile = <VideoTile uri={uri} />;
    } else if (typeof uri === "string" && type === "audio") {
      tile = <AudioTile uri={uri} />;
    } else {
      tile = <Image source={source} style={styles.image} resizeMode="cover" />;
    }
    return tile;
  };

  const content = (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        disabled={!onPress}
      >
        {renderTile()}
      </TouchableOpacity>
      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.6}
        >
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
  return content;
}

// Grid tile for a video: shows the first frame, paused, with a play badge; tapping opens the full preview instead.
function VideoTile({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.pause();
  });

  return (
    <View style={styles.videoTileWrapper}>
      <VideoView
        player={player}
        style={styles.image}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.playBadgeWrapper} pointerEvents="none">
        <View style={styles.playBadge}>
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
        </View>
      </View>
    </View>
  );
}

// Grid tile for a sound recording: mic icon plus clip length; tapping opens the preview to play it.
function AudioTile({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  return (
    <View style={[styles.image, styles.audioTile]}>
      <MaterialIcons name="mic" size={28} color="#007AFF" />
      <Text style={styles.audioDuration}>
        {status.isLoaded ? formatDuration(status.duration) : "--:--"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "31%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoTileWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  playBadgeWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  audioTile: {
    backgroundColor: "#eaf3ff",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  audioDuration: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
