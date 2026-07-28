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
    dayMemoriesHeaderBackground: "#CFE9FB",
    dayMemoriesDateChipBackground: "#4FA8E0",
    dayMemoriesDateChipText: "#FFFFFF",
    dayMemoriesChipBackground: "#FFFFFF",
    dayMemoriesIconColor: "#000000",
    createMemoryCardBackground: "#FBF4E7",
    createMemoryCardBorder: "#E6D9C2",
    createMemoryTitleColor: "#3B2E22",
    createMemorySubtitleColor: "#9C8B72",
    createMemoryInputBackground: "#FFFFFF",
    createMemoryLocationErrorBackground: "#FBEAEA",
    createMemoryLocationErrorBorder: "#E8A0A0",
    createMemoryLocationErrorText: "#C0392B",
  };
  return colors;
};
