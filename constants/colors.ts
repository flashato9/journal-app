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
  };
  return colors;
};
