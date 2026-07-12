import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "@/components/Button";
import PolaroidFrame from "@/components/PolaroidFrame";
import { useChangeProfilePicture } from "@/hooks/options/useChangeProfilePicture";
import { useUserSession } from "@/hooks/welcome/useUserSession";

export default function ChangeProfilePicture() {
  const { profileImagePath } = useUserSession();
  const { displayImagePath, isSaving, canSave, pickImage, handleSave } =
    useChangeProfilePicture({ currentImagePath: profileImagePath });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
        <PolaroidFrame>
          {displayImagePath && (
            <Image
              source={{ uri: displayImagePath }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          )}
        </PolaroidFrame>
        <Text style={styles.infoText}>
          Click to upload a new profile picture
        </Text>
      </TouchableOpacity>

      <View style={styles.buttonWrapper}>
        <Button
          text="Save"
          onPress={handleSave}
          backgroundColor="#007AFF"
          disabled={!canSave || isSaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  buttonWrapper: {
    width: "100%",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
