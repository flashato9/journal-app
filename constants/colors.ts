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
  companionHandleGlow: string;
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
  dayMemoriesHeaderBackground: string;
  dayMemoriesDateChipBackground: string;
  dayMemoriesDateChipText: string;
  dayMemoriesChipBackground: string;
  dayMemoriesIconColor: string;
  createMemoryCardBackground: string;
  createMemoryCardBorder: string;
  createMemoryTitleColor: string;
  createMemorySubtitleColor: string;
  createMemoryInputBackground: string;
  createMemoryLocationErrorBackground: string;
  createMemoryLocationErrorBorder: string;
  createMemoryLocationErrorText: string;
  createMemoryGradientStart: string;
  createMemoryGradientEnd: string;
  createMemorySummaryBackground: string;
  createMemoryOnGradientTextColor: string;
  createMemoryAccentColor: string;
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
    companionHandleGlow: "rgba(0, 122, 255, 0.6)",
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
    dayMemoriesHeaderBackground: "#CFE9FB",
    dayMemoriesDateChipBackground: "#4FA8E0",
    dayMemoriesDateChipText: "#FFFFFF",
    dayMemoriesChipBackground: "#FFFFFF",
    dayMemoriesIconColor: "#000000",
    createMemoryCardBackground: "rgba(253, 248, 235, 0.88)",
    createMemoryCardBorder: "rgba(240, 234, 214, 0.5)",
    createMemoryTitleColor: "#2F4F3A",
    createMemorySubtitleColor: "#7A8C7A",
    createMemoryInputBackground: "rgba(253, 250, 240, 0.9)",
    createMemoryLocationErrorBackground: "#FBEAEA",
    createMemoryLocationErrorBorder: "#E8A0A0",
    createMemoryLocationErrorText: "#C0392B",
    createMemoryGradientStart: "#C9D9BA",
    createMemoryGradientEnd: "#B7CEDE",
    createMemorySummaryBackground: "#E8D9A8",
    createMemoryOnGradientTextColor: "#2F4F3A",
    createMemoryAccentColor: "#8FAE7D",
  };
  return colors;
};
