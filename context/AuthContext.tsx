import { createContext, ReactNode, useState } from "react";

interface LocationSettings {
  fetchFrequency: number;
  notificationThreshold: number;
  restThreshold: number;
  locationTrackingPollFrequency: number;
}

interface AuthContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
  isLoggedIn: boolean;
  locationSettings: LocationSettings | null;
  setLocationSettings: (settings: LocationSettings | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  setUsername: () => {},
  isLoggedIn: false,
  locationSettings: null,
  setLocationSettings: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [locationSettings, setLocationSettings] =
    useState<LocationSettings | null>(null);

  return (
    <AuthContext.Provider
      value={{
        username,
        setUsername,
        isLoggedIn: username !== null,
        locationSettings,
        setLocationSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
