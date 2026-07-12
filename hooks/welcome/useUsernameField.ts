import { useState } from "react";
import { z } from "zod";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, _, - allowed");

// Custom hook that owns a validated username input: live validation as
// the user types, plus a final check to run before submit.
export function useUsernameField(initialUsername: string = "") {
  const [username, setUsername] = useState(initialUsername);
  const [usernameError, setUsernameError] = useState("");

  const handleUsernameChange = (text: string) => {
    setUsername(text);

    // Validate as user types
    if (text === "") {
      setUsernameError("");
      return;
    }

    const result = usernameSchema.safeParse(text);
    if (!result.success) {
      setUsernameError(result.error.issues[0].message);
    } else {
      setUsernameError("");
    }
  };

  // Final validation before submit. Returns whether the username is valid,
  // and sets the error message as a side effect if not.
  const validateUsername = (): boolean => {
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      setUsernameError(result.error.issues[0].message);
      return false;
    }
    return true;
  };

  const isUsernameValid = username.length > 0 && usernameError === "";

  return {
    username,
    usernameError,
    handleUsernameChange,
    validateUsername,
    isUsernameValid,
  };
}
