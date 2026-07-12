import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AUTH_METHOD_OPTIONS } from "@/constants/authMethod";
import Dropdown from "@/components/Dropdown";
import Header from "@/components/Header";
import PolaroidFrame from "@/components/PolaroidFrame";
import { useRegister } from "@/hooks/welcome/useRegister";

export default function RegisterScreen() {
  const {
    username,
    password,
    usernameError,
    passwordError,
    preferredAuthMethod,
    setPreferredAuthMethod,
    profileImageUri,
    pickProfilePicture,
    handleUsernameChange,
    handlePasswordChange,
    handleRegister,
    isRegisterEnabled,
  } = useRegister();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>

          <TouchableOpacity
            style={styles.profilePictureWrapper}
            onPress={pickProfilePicture}
            activeOpacity={0.7}
          >
            <PolaroidFrame>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.uploadText}>Upload a profile picture</Text>
              )}
            </PolaroidFrame>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, usernameError ? styles.inputError : {}]}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={handleUsernameChange}
            editable={true}
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}

          <TextInput
            style={[styles.input, passwordError ? styles.inputError : {}]}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={true}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <View style={styles.authMethodRow}>
            <Text style={styles.label}>Auth Method</Text>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                options={AUTH_METHOD_OPTIONS}
                value={preferredAuthMethod}
                onChange={setPreferredAuthMethod}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              !isRegisterEnabled && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isRegisterEnabled}
            activeOpacity={isRegisterEnabled ? 0.7 : 1}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  inputError: {
    borderColor: "#ff3333",
  },
  profilePictureWrapper: {
    alignSelf: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  errorText: {
    color: "#ff3333",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  authMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  dropdownWrapper: {
    flex: 1,
  },
  registerButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
