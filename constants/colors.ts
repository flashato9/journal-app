export interface AppColors {
  primary: string;
  background: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  border: string;
  error: string;
  disabled: string;
  focus: string;
  shadow: string;
  dayCardBackground: string;
  dayCardAccent: string;
  dayCardAccentText: string;
  dayCardBadgeBackground: string;
  dayCardDivider: string;
  headerBackground: string;
  headerChipBackground: string;
  headerIconColor: string;
  screenBackground: string;
  inputBackground: string;
  loginButtonBackground: string;
}

export const getColors = (): AppColors => {
  const colors: AppColors = {
    primary: "#007AFF",
    background: "#fff",
    text: "#000",
    textMuted: "#999",
    textSecondary: "#666",
    border: "#ddd",
    error: "#ff3333",
    disabled: "#ccc",
    focus: "#999999",
    shadow: "rgba(0, 0, 0, 0.15)",
    dayCardBackground: "#CFE9FB",
    dayCardAccent: "#4FA8E0",
    dayCardAccentText: "#FFFFFF",
    dayCardBadgeBackground: "#FFFFFF",
    dayCardDivider: "#BBBBBB",
    headerBackground: "#CFE9FB",
    headerChipBackground: "#FFFFFF",
    headerIconColor: "#000000",
    screenBackground: "#F2E8D5",
    inputBackground: "#FFFFFF",
    loginButtonBackground: "#3F86B3",
  };
  return colors;
};
