import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";
import { isLocationTrackingActive } from "../services/locationService";

const DEFAULT_POLL_FREQUENCY_SECONDS = 15;

export const OptionsMenuContext = createContext({
  menuVisible: false,
  setMenuVisible: (visible: boolean) => {},
  locationTrackingActive: false,
  refreshLocationTrackingStatus: async () => {},
});

export function OptionsMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [locationTrackingActive, setLocationTrackingActive] = useState(false);
  const { locationSettings } = useContext(AuthContext);
  const pollFrequencySeconds =
    locationSettings?.locationTrackingPollFrequency ??
    DEFAULT_POLL_FREQUENCY_SECONDS;

  const refreshLocationTrackingStatus = useCallback(async () => {
    const isActive = await isLocationTrackingActive();
    setLocationTrackingActive(isActive);
  }, []);

  // Poll location tracking status continuously (not just when the menu is
  // open), so the header's status icon stays fresh on every screen. Screens
  // also call refreshLocationTrackingStatus() on focus for an immediate
  // update instead of waiting for the next interval tick.
  useEffect(() => {
    refreshLocationTrackingStatus();
    const interval = setInterval(
      refreshLocationTrackingStatus,
      pollFrequencySeconds * 1000,
    );

    return () => clearInterval(interval);
  }, [pollFrequencySeconds, refreshLocationTrackingStatus]);

  return (
    <OptionsMenuContext.Provider
      value={{
        menuVisible,
        setMenuVisible,
        locationTrackingActive,
        refreshLocationTrackingStatus,
      }}
    >
      {children}
    </OptionsMenuContext.Provider>
  );
}
