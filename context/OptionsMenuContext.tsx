import { createContext, useEffect, useState } from "react";
import { isLocationTrackingActive } from "../services/locationService";

export const OptionsMenuContext = createContext({
  menuVisible: false,
  setMenuVisible: (visible: boolean) => {},
  locationTrackingActive: false,
});

export function OptionsMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [locationTrackingActive, setLocationTrackingActive] = useState(false);

  // Check location tracking status when menu opens
  useEffect(() => {
    if (menuVisible) {
      const checkLocationTracking = async () => {
        const isActive = await isLocationTrackingActive();
        setLocationTrackingActive(isActive);
      };

      checkLocationTracking();
    }
  }, [menuVisible]);

  return (
    <OptionsMenuContext.Provider
      value={{ menuVisible, setMenuVisible, locationTrackingActive }}
    >
      {children}
    </OptionsMenuContext.Provider>
  );
}
