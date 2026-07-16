import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
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
import MediaCard from "./MediaCard";
import MediaPreviewModal from "./MediaPreviewModal";
import RecordAudioModal from "./RecordAudioModal";

const MAX_MEDIA = 6;

export interface MediaItem {
  uri: string;
  type: MediaType;
  // Set only for gallery-stored images/videos; carried through to the DB so a
  // later backup export can resolve the file's real bytes.
  mediaLibraryAssetId?: string | null;
}

interface UploadMediaProps {
  media: MediaItem[];
  onMediaSelected: (newMedia: MediaItem[]) => void;
  isEditable?: boolean;
}

export default function UploadMedia({
  media,
  onMediaSelected,
  isEditable = true,
}: UploadMediaProps) {
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
  const handleUploadPress = async () => {
    try {
      const options = ["Camera", "Photo Library", "Record Sound", "Cancel"];

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: 3 },
          async (buttonIndex) => {
            if (buttonIndex === 0) {
              await takePhoto();
            } else if (buttonIndex === 1) {
              await pickFromLibrary();
            } else if (buttonIndex === 2) {
              setIsRecording(true);
            }
          },
        );
      } else {
        Alert.alert("Upload Media", "Choose an option", [
          { text: "Camera", onPress: takePhoto },
          {
            text: "Photo Library",
            onPress: pickFromLibrary,
          },
          { text: "Record Sound", onPress: () => setIsRecording(true) },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    } catch (error) {
      console.error("Error with media picker:", error);
      Alert.alert("Error", "Failed to upload media");
    }
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
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        // Use composite key for Android compatibility (assetId is null on Android)
        const assetId =
          asset.assetId || `${asset.fileSize}-${asset.width}-${asset.height}`;

        console.log("Camera photo taken:");
        console.log(`  assetId: "${asset.assetId}", composite: "${assetId}"`);
        console.log(
          `  fileSize: ${asset.fileSize}, dimensions: ${asset.width}x${asset.height}`,
        );
        console.log(`  existing ids:`, Array.from(imageAssetIds));
        console.log(`  isDuplicate: ${imageAssetIds.has(assetId)}`);

        // Check if already exists using composite key
        if (!imageAssetIds.has(assetId) && media.length < MAX_MEDIA) {
          const newAssetIds = new Set(imageAssetIds);
          newAssetIds.add(assetId);

          // Save image persistently
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

  return (
    <View style={styles.container}>
      {isLoading && isEditable ? (
        <LoadingIndicator message="Processing media..." />
      ) : media.length === 0 && isEditable ? (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadPress}
        >
          <MaterialIcons name="add-photo-alternate" size={24} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Upload Media</Text>
        </TouchableOpacity>
      ) : media.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noImagesText}>No media</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={media}
            renderItem={({ item, index }) => (
              <MediaCard
                uri={item.uri}
                type={item.type}
                onRemove={isEditable ? () => removeMedia(index) : undefined}
                onPress={() => setPreviewItem(item)}
              />
            )}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.imageGrid}
          />
          {isEditable && (
            <TouchableOpacity
              style={[
                styles.uploadMoreButton,
                media.length >= MAX_MEDIA && styles.uploadMoreButtonDisabled,
              ]}
              onPress={handleUploadPress}
              activeOpacity={0.7}
              disabled={media.length >= MAX_MEDIA}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={20}
                color={media.length >= MAX_MEDIA ? "#999" : "white"}
              />
              <Text
                style={[
                  styles.uploadMoreButtonText,
                  media.length >= MAX_MEDIA &&
                    styles.uploadMoreButtonTextDisabled,
                ]}
              >
                {media.length >= MAX_MEDIA ? "Maximum reached" : "Add More"}
              </Text>
            </TouchableOpacity>
          )}
        </>
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
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  uploadButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  imageGrid: {
    marginBottom: 12,
  },
  uploadMoreButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadMoreButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  uploadMoreButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadMoreButtonTextDisabled: {
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 16,
  },
  noImagesText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
