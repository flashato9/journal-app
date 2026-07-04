import { createContext, useState } from "react";

export const OptionsMenuContext = createContext({
  menuVisible: false,
  setMenuVisible: (visible: boolean) => {},
});

export function OptionsMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <OptionsMenuContext.Provider value={{ menuVisible, setMenuVisible }}>
      {children}
    </OptionsMenuContext.Provider>
  );
}
