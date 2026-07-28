import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { getColors } from "@/constants/colors";

const colors = getColors();
const passwordInputShadow = `0px 4px 6px rgba(0, 0, 0, 0.2), inset 0px 1px 2px ${colors.shadow}`;
const ICON_SIZE = 20;

interface LoginPasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

// Pill-shaped password field with a lock icon and a tap-to-reveal eye toggle, used only on the login screen.
export default function LoginPasswordInput({
  value,
  onChangeText,
}: LoginPasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(
      (previousIsPasswordVisible) => !previousIsPasswordVisible,
    );
  };

  const eyeIconName = isPasswordVisible ? "eye" : "eye-off";

  const content = (
    <View style={styles.wrapper}>
      <View style={styles.iconSlot}>
        <MaterialCommunityIcons
          name="lock"
          size={ICON_SIZE}
          color={colors.text}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isPasswordVisible}
        testID="login-password-input"
      />
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.iconSlot}
      >
        <MaterialCommunityIcons
          name={eyeIconName}
          size={ICON_SIZE}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    boxShadow: passwordInputShadow,
  },
  iconSlot: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
