import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loadEmergencyProfile, saveEmergencyProfile } from "./storage";
import type { EmergencyProfile } from "./types";
import { EMPTY_PROFILE } from "./validation";

interface ProfileContextValue {
  hasCompletedSetup: boolean;
  isHydrated: boolean;
  profile: EmergencyProfile;
  saveProfile: (profile: EmergencyProfile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [storedProfile, setStoredProfile] = useState<EmergencyProfile | null>(
    null
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateProfile = async () => {
      try {
        const savedProfile = await loadEmergencyProfile();
        if (isMounted) {
          setStoredProfile(savedProfile);
        }
      } catch {
        if (isMounted) {
          setStoredProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = useCallback(async (profile: EmergencyProfile) => {
    await saveEmergencyProfile(profile);
    setStoredProfile(profile);
  }, []);

  const value = useMemo(
    () => ({
      hasCompletedSetup: storedProfile !== null,
      isHydrated,
      profile: storedProfile ?? EMPTY_PROFILE,
      saveProfile,
    }),
    [isHydrated, saveProfile, storedProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
