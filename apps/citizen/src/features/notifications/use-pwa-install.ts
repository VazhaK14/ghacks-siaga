import { useCallback, useEffect, useState } from "react";

import type { BeforeInstallPromptEvent } from "./types";

const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches;

export const usePwaInstall = () => {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [installPrompt]);

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    install,
    isInstalled,
  };
};
