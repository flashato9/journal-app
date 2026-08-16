import { StyleSheet, Switch, Text, View } from "react-native";
import LoadingIndicator from "@/components/LoadingIndicator";
import { COMPANION_NARROWABLE_FIELDS } from "@/constants/companionFields";
import { useCompanionFieldVisibility } from "@/hooks/options/useCompanionFieldVisibility";

export default function CompanionVisibilitySettings() {
  const { loading, isFieldHidden, toggleField } = useCompanionFieldVisibility();

  if (loading) {
    const loadingContent = (
      <View style={styles.loadingContainer}>
        <LoadingIndicator message="Loading settings..." />
      </View>
    );
    return loadingContent;
  }

  const content = (
    <View style={styles.content}>
      <Text style={styles.description}>
        Turn a field off to hide it from what the companion sees on that screen.
        Passwords are never visible to it, on or off.
      </Text>
      {COMPANION_NARROWABLE_FIELDS.map((field) => {
        const isVisible = !isFieldHidden(field.screenKey, field.fieldKey);
        return (
          <View key={`${field.screenKey}.${field.fieldKey}`} style={styles.row}>
            <Text style={styles.label}>
              {field.screenLabel} - {field.fieldLabel}
            </Text>
            <Switch
              value={isVisible}
              onValueChange={(visible) =>
                toggleField(field.screenKey, field.fieldKey, !visible)
              }
            />
          </View>
        );
      })}
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  content: {
    gap: 12,
  },
  description: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#000",
    flex: 1,
    marginRight: 12,
  },
});
