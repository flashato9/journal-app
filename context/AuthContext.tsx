import { createContext, ReactNode, useState } from "react";

interface LocationSettings {
  fetchFrequency: number;
  notificationThreshold: number;
  restThreshold: number;
}

interface AuthContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
  locationSettings: LocationSettings | null;
  setLocationSettings: (settings: LocationSettings | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  setUsername: () => {},
  locationSettings: null,
  setLocationSettings: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [locationSettings, setLocationSettings] = useState<LocationSettings | null>(null);

  return (
    <AuthContext.Provider value={{ username, setUsername, locationSettings, setLocationSettings }}>
      {children}
    </AuthContext.Provider>
  );
};
