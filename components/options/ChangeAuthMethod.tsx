import { StyleSheet, Text, View } from "react-native";
import { AUTH_METHOD_OPTIONS } from "@/constants/authMethod";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import { useChangeAuthMethod } from "@/hooks/options/useChangeAuthMethod";

export default function ChangeAuthMethod() {
  const {
    selectedMethod,
    setSelectedMethod,
    isSaveEnabled,
    isSaving,
    handleSave,
  } = useChangeAuthMethod();

  const content = (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Auth Method</Text>
        <View style={styles.dropdownWrapper}>
          <Dropdown
            options={AUTH_METHOD_OPTIONS}
            value={selectedMethod}
            onChange={setSelectedMethod}
          />
        </View>
      </View>

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
  return content;
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
  dropdownWrapper: {
    flex: 1,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 8,
  },
});
