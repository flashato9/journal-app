import { useState } from "react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(50, "Password must be at most 50 characters");

// Custom hook that owns a validated password input: live validation as
// the user types, plus a final check to run before submit. Mirrors
// useUsernameField.ts's shape.
export function usePasswordField() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = (text: string) => {
    setPassword(text);

    // Validate as user types
    if (text === "") {
      setPasswordError("");
      return;
    }

    const result = passwordSchema.safeParse(text);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
    } else {
      setPasswordError("");
    }
  };

  // Final validation before submit. Returns whether the password is valid,
  // and sets the error message as a side effect if not.
  const validatePassword = (): boolean => {
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
      return false;
    }
    return true;
  };

  const resetPassword = () => {
    setPassword("");
    setPasswordError("");
  };

  const isPasswordValid = password.length > 0 && passwordError === "";

  return {
    password,
    passwordError,
    handlePasswordChange,
    validatePassword,
    isPasswordValid,
    resetPassword,
  };
}
