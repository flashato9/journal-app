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
import { saveImagePersistently } from "@/services/imageStorage";
import LoadingIndicator from "@/components/LoadingIndicator";
import ImageCard from "./ImageCard";

const MAX_IMAGES = 6;

interface UploadImagesProps {
  images: string[];
  onImagesSelected: (newImages: string[]) => void;
  isEditable?: boolean;
}

export default function UploadImages({
  images,
  onImagesSelected,
  isEditable = true,
}: UploadImagesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageAssetIds, setImageAssetIds] = useState<Set<string>>(new Set());

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    onImagesSelected(updatedImages);

    // Rebuild assetId set from remaining images
    // Note: This is a simplified approach - in production you might want to track assetIds separately
    const newAssetIds = new Set<string>();
    setImageAssetIds(newAssetIds);
  };
  const handleUploadPress = async () => {
    try {
      const options = ["Camera", "Photo Library", "Cancel"];

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: 2 },
          async (buttonIndex) => {
            if (buttonIndex === 0) {
              await takePhoto();
            } else if (buttonIndex === 1) {
              await pickFromLibrary();
            }
          },
        );
      } else {
        Alert.alert("Upload Image", "Choose an option", [
          { text: "Camera", onPress: takePhoto },
          {
            text: "Photo Library",
            onPress: pickFromLibrary,
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    } catch (error) {
      console.error("Error with image picker:", error);
      Alert.alert("Error", "Failed to upload image");
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
        if (!imageAssetIds.has(assetId) && images.length < MAX_IMAGES) {
          const newAssetIds = new Set(imageAssetIds);
          newAssetIds.add(assetId);

          // Save image persistently
          try {
            const persistentPath = await saveImagePersistently(asset.uri);
            onImagesSelected([...images, persistentPath]);
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
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(0, MAX_IMAGES - images.length),
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

        // Save images persistently
        try {
          const persistentPaths = await Promise.all(
            uniqueAssets.map((asset) => saveImagePersistently(asset.uri)),
          );

          // Add new unique images and enforce max 6 limit
          let updatedImages = [...images, ...persistentPaths];
          // Enforce max 6 images
          updatedImages = updatedImages.slice(0, MAX_IMAGES);

          onImagesSelected(updatedImages);
          setImageAssetIds(newAssetIds);
          setTimeout(() => setIsLoading(false), 300);
        } catch (error) {
          console.error("Error saving images:", error);
          Alert.alert("Error", "Failed to save images");
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
        <LoadingIndicator message="Processing images..." />
      ) : images.length === 0 && isEditable ? (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadPress}
        >
          <MaterialIcons name="add-photo-alternate" size={24} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Upload Images</Text>
        </TouchableOpacity>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noImagesText}>No images</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={images}
            renderItem={({ item, index }) => (
              <ImageCard
                uri={item}
                onRemove={isEditable ? () => removeImage(index) : undefined}
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
                images.length >= MAX_IMAGES && styles.uploadMoreButtonDisabled,
              ]}
              onPress={handleUploadPress}
              activeOpacity={0.7}
              disabled={images.length >= MAX_IMAGES}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={20}
                color={images.length >= MAX_IMAGES ? "#999" : "white"}
              />
              <Text
                style={[
                  styles.uploadMoreButtonText,
                  images.length >= MAX_IMAGES &&
                    styles.uploadMoreButtonTextDisabled,
                ]}
              >
                {images.length >= MAX_IMAGES
                  ? "Maximum images reached"
                  : "Add More Images"}
              </Text>
            </TouchableOpacity>
          )}
        </>
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
