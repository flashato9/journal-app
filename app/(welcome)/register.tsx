import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { AUTH_METHOD_OPTIONS } from "@/constants/authMethod";
import { getColors } from "@/constants/colors";
import Dropdown from "@/components/Dropdown";
import Input from "@/components/Input";
import PolaroidFrame from "@/components/PolaroidFrame";
import { useRegister } from "@/hooks/welcome/useRegister";

const colors = getColors();

export default function RegisterScreen() {
  const {
    username,
    password,
    usernameError,
    passwordError,
    confirmPassword,
    confirmPasswordError,
    handleConfirmPasswordChange,
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.profilePictureWrapper}>
          <PolaroidFrame
            isTilted={false}
            caption={username}
            placeholder="Username"
            onPress={pickProfilePicture}
          >
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
        </View>

        <Input
          placeholder="Username"
          value={username}
          onChangeText={handleUsernameChange}
          error={usernameError}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          testID="register-password-input"
          error={passwordError}
        />

        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
          error={confirmPasswordError}
        />

        <View style={styles.authMethodRow}>
          <Text style={styles.label}>Auth Method</Text>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              options={AUTH_METHOD_OPTIONS}
              value={preferredAuthMethod}
              onChange={setPreferredAuthMethod}
              testID="auth-method-dropdown"
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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: colors.text,
  },
  profilePictureWrapper: {
    alignSelf: "center",
    marginBottom: 24,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  authMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dropdownWrapper: {
    flex: 1,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
