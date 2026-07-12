import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "@/components/Button";
import { useChangeUsername } from "@/hooks/options/useChangeUsername";

export default function ChangeUsername() {
  const {
    username,
    usernameError,
    handleUsernameChange,
    isSaveEnabled,
    isSaving,
    handleSave,
  } = useChangeUsername();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputFlex,
            usernameError ? styles.inputError : {},
          ]}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={handleUsernameChange}
        />
      </View>
      {usernameError ? (
        <Text style={styles.errorText}>{usernameError}</Text>
      ) : null}

      <View style={styles.buttonWrapper}>
        <Button
          text="Save"
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
