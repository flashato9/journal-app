import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "@/components/Button";
import { useChangePassword } from "@/hooks/options/useChangePassword";

export default function ChangePassword() {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    passwordError,
    handlePasswordChange,
    isSaveEnabled,
    isSaving,
    handleSave,
  } = useChangePassword();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Current Password"
          placeholderTextColor="#999"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputFlex,
            passwordError ? styles.inputError : {},
          ]}
          placeholder="New Password"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={handlePasswordChange}
          secureTextEntry
        />
      </View>
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : null}

      <View style={styles.buttonWrapper}>
        <Button
          text="Update Password"
          onPress={handleSave}
          backgroundColor="#007AFF"
          disabled={!isSaveEnabled || isSaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
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
  inputFlex: {
    flex: 1,
  },
  inputError: {
    borderColor: "#ff3333",
  },
  errorText: {
    color: "#ff3333",
    fontSize: 12,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 8,
  },
});
