import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authClient } from "@/lib/auth-client";

import {
  useReporterProfileQuery,
  useUpdateReporterProfileMutation,
} from "./api";
import { loadEmergencyProfile, saveEmergencyProfile } from "./storage";
import type { EmergencyProfile } from "./types";
import { EMPTY_PROFILE, validateEmergencyProfile } from "./validation";

interface ProfileContextValue {
  hasCompletedSetup: boolean;
  isHydrated: boolean;
  profile: EmergencyProfile;
  saveProfile: (profile: EmergencyProfile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const session = authClient.useSession();
  const remoteProfile = useReporterProfileQuery(Boolean(session.data));
  const updateRemoteProfile = useUpdateReporterProfileMutation();
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

  useEffect(() => {
    if (remoteProfile.data) {
      setStoredProfile(remoteProfile.data);
      saveEmergencyProfile(remoteProfile.data).catch(() => undefined);
    }
  }, [remoteProfile.data]);

  const saveProfile = useCallback(
    async (newProfile: EmergencyProfile) => {
      await updateRemoteProfile.mutateAsync(newProfile);
      await saveEmergencyProfile(newProfile);
      setStoredProfile(newProfile);
    },
    [updateRemoteProfile.mutateAsync]
  );

  const profile = remoteProfile.data ?? storedProfile ?? EMPTY_PROFILE;
  const hasCompletedSetup = validateEmergencyProfile(profile).success;

  const value = useMemo(
    () => ({
      hasCompletedSetup,
      isHydrated: isHydrated && !(session.data && remoteProfile.isPending),
      profile,
      saveProfile,
    }),
    [
      hasCompletedSetup,
      isHydrated,
      profile,
      remoteProfile.isPending,
      saveProfile,
      session.data,
    ]
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
