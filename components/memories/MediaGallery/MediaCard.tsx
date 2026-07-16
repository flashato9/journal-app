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
  // Handle both string URIs and require() results
  const source = typeof uri === "string" ? { uri } : uri;

  // Video and audio tiles need a real URI string to load a player; a require()
  // source can only ever be an image, so it falls through to <Image>.
  const renderTile = () => {
    if (typeof uri === "string" && type === "video") {
      return <VideoTile uri={uri} />;
    }
    if (typeof uri === "string" && type === "audio") {
      return <AudioTile uri={uri} />;
    }
    return <Image source={source} style={styles.image} resizeMode="cover" />;
  };

  return (
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
}

// Grid tile for a video: shows the first frame, paused, no controls, with a
// translucent play badge over it — tapping the tile opens the full preview
// (playback happens there instead). pointerEvents="none" on the badge keeps
// the tap going to the tile's own TouchableOpacity, not the icon.
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

// Grid tile for a sound recording. There's no frame to show, so this is a mic
// icon plus the clip length; tapping opens the preview, where it actually plays.
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
  // Translucent so the video frame stays visible through the badge.
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
