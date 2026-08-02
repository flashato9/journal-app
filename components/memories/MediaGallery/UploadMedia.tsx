import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  MediaType,
  saveAudioPersistently,
  saveImagePersistently,
  saveVideoPersistently,
} from "@/services/mediaStorage";
import LoadingIndicator from "@/components/LoadingIndicator";
import { getColors } from "@/constants/colors";
import MediaCard from "./MediaCard";
import MediaPreviewModal from "./MediaPreviewModal";
import RecordAudioModal from "./RecordAudioModal";

const colors = getColors();
const MAX_MEDIA = 8;
const MAX_VIDEO_DURATION_SECONDS = 300;

export interface MediaItem {
  // Set only for media already saved to the DB; absent for newly-picked items
  // this session — lets edit-save tell "kept" from "brand new" apart.
  id?: number;
  uri: string;
  type: MediaType;
  // Set only for gallery-stored images/videos; carried through to the DB so a
  // later backup export can resolve the file's real bytes.
  mediaLibraryAssetId?: string | null;
}

interface MediaGridSlot {
  key: string;
  item: MediaItem | null;
  mediaIndex: number | null;
}

interface UploadMediaProps {
  media: MediaItem[];
  onMediaSelected: (newMedia: MediaItem[]) => void;
  isEditable?: boolean;
}

// Pads the filled media slots with empty (tappable "+") slots up to MAX_MEDIA when editable.
function buildGridSlots(
  media: MediaItem[],
  isEditable: boolean,
): MediaGridSlot[] {
  const filledSlots: MediaGridSlot[] = media.map((item, index) => {
    const slot = { key: `filled-${index}`, item, mediaIndex: index };
    return slot;
  });
  if (!isEditable) {
    return filledSlots;
  }
  const emptyCount = Math.max(0, MAX_MEDIA - media.length);
  const arrayLengthOptions = { length: emptyCount };
  const emptySlots: MediaGridSlot[] = Array.from(
    arrayLengthOptions,
    (_, index) => {
      const slot = { key: `empty-${index}`, item: null, mediaIndex: null };
      return slot;
    },
  );
  const slots = [...filledSlots, ...emptySlots];
  return slots;
}

export default function UploadMedia({
  media,
  onMediaSelected,
  isEditable = true,
}: UploadMediaProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const [isLoading, setIsLoading] = useState(false);
  const [imageAssetIds, setImageAssetIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const removeMedia = (indexToRemove: number) => {
    const updatedMedia = media.filter((_, idx) => idx !== indexToRemove);
    onMediaSelected(updatedMedia);

    // Rebuild assetId set from remaining media
    // Note: This is a simplified approach - in production you might want to track assetIds separately
    const newAssetIds = new Set<string>();
    setImageAssetIds(newAssetIds);
  };
  const handleUploadPress = () => {
    const options = [
      "Take Picture",
      "Record Video",
      "Media Gallery",
      "Record Sound",
      "Cancel",
    ];
    const cancelButtonIndex = 4;
    const optionIcons = [
      <MaterialIcons
        name="photo-camera"
        size={22}
        color={colors.createMemoryTitleColor}
        key="take-picture-icon"
      />,
      <MaterialIcons
        name="videocam"
        size={22}
        color={colors.createMemoryTitleColor}
        key="record-video-icon"
      />,
      <MaterialIcons
        name="photo-library"
        size={22}
        color={colors.createMemoryTitleColor}
        key="media-gallery-icon"
      />,
      <MaterialIcons
        name="mic"
        size={22}
        color={colors.createMemoryTitleColor}
        key="record-sound-icon"
      />,
      <MaterialIcons
        name="close"
        size={22}
        color={colors.createMemorySubtitleColor}
        key="cancel-icon"
      />,
    ];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        icons: optionIcons,
        containerStyle: {
          backgroundColor: colors.createMemoryCardBackground,
          borderColor: colors.createMemoryCardBorder,
          borderWidth: 1,
          borderRadius: 20,
          marginHorizontal: 16,
          marginBottom: 24,
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
        },
        textStyle: {
          color: colors.createMemoryTitleColor,
          fontWeight: "600",
          fontSize: 17,
        },
        showSeparators: true,
        separatorStyle: {
          backgroundColor: colors.createMemoryCardBorder,
        },
        cancelButtonTintColor: colors.createMemorySubtitleColor,
      },
      async (buttonIndex) => {
        try {
          if (buttonIndex === 0) {
            await takePhoto();
          } else if (buttonIndex === 1) {
            await recordVideo();
          } else if (buttonIndex === 2) {
            await pickFromLibrary();
          } else if (buttonIndex === 3) {
            setIsRecording(true);
          }
        } catch (error) {
          console.error("Error with media picker:", error);
          Alert.alert("Error", "Failed to upload media");
        }
      },
    );
  };

  // Recordings skip the imageAssetIds dedupe entirely — there's no asset ID to
  // compare, and every recording is new by definition.
  const handleRecorded = async (temporaryUri: string) => {
    setIsRecording(false);

    // The "Add More" button is already disabled at the cap, but guard anyway to
    // match takePhoto/pickFromLibrary rather than silently dropping a recording.
    if (media.length >= MAX_MEDIA) {
      Alert.alert("Maximum reached", `You can add up to ${MAX_MEDIA} items`);
      return;
    }

    setIsLoading(true);
    try {
      const saved = await saveAudioPersistently(temporaryUri);
      onMediaSelected([
        ...media,
        {
          uri: saved.uri,
          type: "audio",
          mediaLibraryAssetId: saved.mediaLibraryAssetId,
        },
      ]);
    } catch (error) {
      console.error("Error saving audio:", error);
      Alert.alert("Error", "Failed to save recording");
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const takePhoto = async () => {
    setIsLoading(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission denied", "Camera access is required");
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        if (media.length >= MAX_MEDIA) {
          Alert.alert(
            "Maximum reached",
            `You can add up to ${MAX_MEDIA} items`,
          );
          setTimeout(() => setIsLoading(false), 300);
          return;
        }

        // Use composite key for Android compatibility (assetId is null on Android)
        const assetId =
          asset.assetId || `${asset.fileSize}-${asset.width}-${asset.height}`;

        if (!imageAssetIds.has(assetId)) {
          const newAssetIds = new Set(imageAssetIds);
          newAssetIds.add(assetId);

          try {
            const saved = await saveImagePersistently(asset.uri);
            onMediaSelected([
              ...media,
              {
                uri: saved.uri,
                type: "image",
                mediaLibraryAssetId: saved.mediaLibraryAssetId,
              },
            ]);
            setImageAssetIds(newAssetIds);
          } catch (error) {
            console.error("Error saving image:", error);
            Alert.alert("Error", "Failed to save image");
            setTimeout(() => setIsLoading(false), 300);
            return;
          }
        }
        setTimeout(() => setIsLoading(false), 300);
      } else {
        setIsLoading(false);
      }
    } catch {
      Alert.alert("Error", "Failed to access camera");
      setIsLoading(false);
    }
  };

  const recordVideo = async () => {
    setIsLoading(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission denied", "Camera access is required");
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        if (media.length >= MAX_MEDIA) {
          Alert.alert(
            "Maximum reached",
            `You can add up to ${MAX_MEDIA} items`,
          );
          setTimeout(() => setIsLoading(false), 300);
          return;
        }

        try {
          const saved = await saveVideoPersistently(asset.uri);
          onMediaSelected([
            ...media,
            {
              uri: saved.uri,
              type: "video",
              mediaLibraryAssetId: saved.mediaLibraryAssetId,
            },
          ]);
        } catch (error) {
          console.error("Error saving video:", error);
          Alert.alert("Error", "Failed to save video");
          setTimeout(() => setIsLoading(false), 300);
          return;
        }
        setTimeout(() => setIsLoading(false), 300);
      } else {
        setIsLoading(false);
      }
    } catch {
      Alert.alert("Error", "Failed to access camera");
      setIsLoading(false);
    }
  };

  const pickFromLibrary = async () => {
    setIsLoading(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission denied", "Photo library access is required");
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(0, MAX_MEDIA - media.length),
        quality: 1,
      });

      if (!result.canceled) {
        setIsLoading(true);

        // Debug: log all selected assets and their IDs
        console.log("Selected assets:");
        result.assets.forEach((asset, idx) => {
          console.log(
            `  Asset ${idx}: assetId="${asset.assetId}", fileSize=${asset.fileSize}, dimensions=${asset.width}x${asset.height}, uri="${asset.uri}"`,
          );
        });

        console.log("Existing imageIds:", Array.from(imageAssetIds));

        // Filter out duplicates using composite key: fileSize + width + height
        // This works even on Android where assetId is null
        const newAssetIds = new Set(imageAssetIds);
        const uniqueAssets = result.assets.filter((asset) => {
          // Create composite ID from stable image properties
          const id =
            asset.assetId || `${asset.fileSize}-${asset.width}-${asset.height}`;
          console.log(`  Composite ID: "${id}"`);
          console.log(`  Exists in set: ${newAssetIds.has(id)}`);
          if (newAssetIds.has(id)) {
            return false;
          }
          newAssetIds.add(id);
          return true;
        });

        console.log("Unique assets after filtering:", uniqueAssets.length);

        // Save images/videos persistently
        try {
          const newItems: MediaItem[] = await Promise.all(
            uniqueAssets.map(async (asset) => {
              const isVideo = asset.type === "video";
              const saved = isVideo
                ? await saveVideoPersistently(asset.uri)
                : await saveImagePersistently(asset.uri);
              return {
                uri: saved.uri,
                type: isVideo ? "video" : "image",
                mediaLibraryAssetId: saved.mediaLibraryAssetId,
              } as MediaItem;
            }),
          );

          // Add new unique media and enforce max limit
          let updatedMedia = [...media, ...newItems];
          updatedMedia = updatedMedia.slice(0, MAX_MEDIA);

          onMediaSelected(updatedMedia);
          setImageAssetIds(newAssetIds);
          setTimeout(() => setIsLoading(false), 300);
        } catch (error) {
          console.error("Error saving media:", error);
          Alert.alert("Error", "Failed to save media");
          setTimeout(() => setIsLoading(false), 300);
        }
      } else {
        setIsLoading(false);
      }
    } catch {
      Alert.alert("Error", "Failed to access photo library");
      setIsLoading(false);
    }
  };

  const gridSlots = buildGridSlots(media, isEditable);

  const content = (
    <View style={styles.container}>
      {isLoading && isEditable ? (
        <LoadingIndicator message="Processing media..." />
      ) : gridSlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noImagesText}>No media</Text>
        </View>
      ) : (
        <FlatList
          data={gridSlots}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item: slot }) => {
            if (slot.item === null) {
              const emptyTile = (
                <TouchableOpacity
                  style={styles.emptySlot}
                  onPress={handleUploadPress}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="add"
                    size={28}
                    color={colors.createMemorySubtitleColor}
                  />
                </TouchableOpacity>
              );
              return emptyTile;
            }
            const mediaItem = slot.item;
            const mediaIndex = slot.mediaIndex;
            const filledTile = (
              <MediaCard
                uri={mediaItem.uri}
                type={mediaItem.type}
                onRemove={
                  isEditable && mediaIndex !== null
                    ? () => removeMedia(mediaIndex)
                    : undefined
                }
                onPress={() => setPreviewItem(mediaItem)}
              />
            );
            return filledTile;
          }}
          keyExtractor={(slot) => slot.key}
          numColumns={4}
          scrollEnabled={false}
        />
      )}
      <MediaPreviewModal
        visible={previewItem !== null}
        uri={previewItem?.uri ?? null}
        type={previewItem?.type ?? "image"}
        onClose={() => setPreviewItem(null)}
      />
      {/* Mounted only while recording so the recorder (and the mic session it
          holds) is torn down as soon as the modal closes. */}
      {isRecording && (
        <RecordAudioModal
          visible
          onRecorded={handleRecorded}
          onClose={() => setIsRecording(false)}
        />
      )}
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  emptySlot: {
    width: "22%",
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.createMemoryCardBorder,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 16,
  },
  noImagesText: {
    fontSize: 14,
    color: colors.createMemorySubtitleColor,
    fontStyle: "italic",
  },
});
