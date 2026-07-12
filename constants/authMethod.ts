export type PreferredAuthMethod = "PASSWORD" | "BIOMETRIC";

export const AUTH_METHOD_OPTIONS: {
  label: string;
  value: PreferredAuthMethod;
}[] = [
  { label: "Password", value: "PASSWORD" },
  { label: "Fingerprint", value: "BIOMETRIC" },
];
