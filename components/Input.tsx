import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { getColors } from "@/constants/colors";

const colors = getColors();
const inputInsetShadow = `inset 0px 1px 2px ${colors.shadow}`;

const getInputGlowShadow = (glowColor: string): string => {
  const glowShadow = `${inputInsetShadow}, 0px 0px 3px ${glowColor}`;
  return glowShadow;
};

const getInputWrapperStyle = (
  error: string | undefined,
  isFocused: boolean,
) => {
  if (error && isFocused) {
    const style = [styles.inputWrapper, styles.inputWrapperErrorGlow];
    return style;
  }
  if (error) {
    const style = [styles.inputWrapper, styles.inputWrapperErrorPlain];
    return style;
  }
  if (isFocused) {
    const style = [styles.inputWrapper, styles.inputWrapperGlow];
    return style;
  }
  const style = styles.inputWrapper;
  return style;
};

interface InputProps extends TextInputProps {
  error?: string;
}

export default function Input({
  error,
  onFocus,
  onBlur,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const content = (
    <View style={styles.container}>
      <View style={getInputWrapperStyle(error, isFocused)}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputWrapper: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    boxShadow: inputInsetShadow,
  },
  inputWrapperGlow: {
    borderColor: colors.focus,
    boxShadow: getInputGlowShadow(colors.focus),
  },
  inputWrapperErrorGlow: {
    borderColor: colors.error,
    boxShadow: getInputGlowShadow(colors.error),
  },
  inputWrapperErrorPlain: {
    borderColor: colors.error,
    boxShadow: inputInsetShadow,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
