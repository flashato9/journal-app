import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChangeAuthMethod from "@/components/options/ChangeAuthMethod";
import ChangePassword from "@/components/options/ChangePassword";
import ChangeProfilePicture from "@/components/options/ChangeProfilePicture";
import ChangeUsername from "@/components/options/ChangeUsername";
import LocationSettings from "@/components/options/LocationSettings";
import Header from "@/components/Header";

export default function ProfileSettingsScreen() {
  const [isProfilePictureOpen, setIsProfilePictureOpen] = useState(false);
  const [isUsernameOpen, setIsUsernameOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isAuthMethodOpen, setIsAuthMethodOpen] = useState(false);
  const [isLocationSettingsOpen, setIsLocationSettingsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Profile Settings" hideProfileIcon />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          onPress={() => setIsProfilePictureOpen((open) => !open)}
        >
          <Text style={styles.link}>Change Profile Picture</Text>
        </TouchableOpacity>

        {isProfilePictureOpen && <ChangeProfilePicture />}

        <TouchableOpacity onPress={() => setIsUsernameOpen((open) => !open)}>
          <Text style={styles.link}>Change Username</Text>
        </TouchableOpacity>

        {isUsernameOpen && <ChangeUsername />}

        <TouchableOpacity onPress={() => setIsPasswordOpen((open) => !open)}>
          <Text style={styles.link}>Change Password</Text>
        </TouchableOpacity>

        {isPasswordOpen && <ChangePassword />}

        <TouchableOpacity onPress={() => setIsAuthMethodOpen((open) => !open)}>
          <Text style={styles.link}>Change Preferred Authentication Type</Text>
        </TouchableOpacity>

        {isAuthMethodOpen && <ChangeAuthMethod />}

        <TouchableOpacity
          onPress={() => setIsLocationSettingsOpen((open) => !open)}
        >
          <Text style={styles.link}>Location Settings</Text>
        </TouchableOpacity>

        {isLocationSettingsOpen && <LocationSettings />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
  },
  link: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
