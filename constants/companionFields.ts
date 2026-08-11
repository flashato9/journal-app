export interface CompanionNarrowableField {
  screenKey: string;
  screenLabel: string;
  fieldKey: string;
  fieldLabel: string;
}

export const COMPANION_NARROWABLE_FIELDS: CompanionNarrowableField[] = [
  {
    screenKey: "register",
    screenLabel: "Register",
    fieldKey: "username",
    fieldLabel: "Username",
  },
  {
    screenKey: "register",
    screenLabel: "Register",
    fieldKey: "profileImageUri",
    fieldLabel: "Profile picture",
  },
  {
    screenKey: "login",
    screenLabel: "Login",
    fieldKey: "username",
    fieldLabel: "Username",
  },
  {
    screenKey: "daymemories",
    screenLabel: "Day Memories",
    fieldKey: "day",
    fieldLabel: "Day",
  },
  {
    screenKey: "daymemories",
    screenLabel: "Day Memories",
    fieldKey: "daySummary",
    fieldLabel: "Day summary",
  },
  {
    screenKey: "daymemories",
    screenLabel: "Day Memories",
    fieldKey: "memoryCount",
    fieldLabel: "Memory count",
  },
];
