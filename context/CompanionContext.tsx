import { createContext, ReactNode, useEffect, useState } from "react";
import { getCompanionApi } from "@/services/companionApi";

export type CompanionStatus = "connecting" | "ready";

interface CompanionContextType {
  status: CompanionStatus;
}

export const CompanionContext = createContext<CompanionContextType>({
  status: "connecting",
});

async function connectCompanion(
  setStatus: (status: CompanionStatus) => void,
): Promise<void> {
  const companionApi = getCompanionApi();
  await companionApi.connect();
  setStatus("ready");
  console.log("[Companion] online");
}

interface CompanionProviderProps {
  children: ReactNode;
}

export const CompanionProvider = ({ children }: CompanionProviderProps) => {
  const [status, setStatus] = useState<CompanionStatus>("connecting");

  useEffect(() => {
    console.log("[Companion] sleeping");
    connectCompanion(setStatus);
  }, []);

  const content = (
    <CompanionContext.Provider value={{ status }}>
      {children}
    </CompanionContext.Provider>
  );
  return content;
};
