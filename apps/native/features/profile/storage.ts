import { getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

import type { EmergencyProfile } from "./types";
import { isEmergencyProfile, validateEmergencyProfile } from "./validation";

const PROFILE_STORAGE_KEY = "siaga.emergency-profile.v1";

const readStoredValue = (): Promise<string | null> => {
  if (Platform.OS === "web") {
    const storedValue =
      globalThis.localStorage?.getItem(PROFILE_STORAGE_KEY) ?? null;
    return Promise.resolve(storedValue);
  }

  return getItemAsync(PROFILE_STORAGE_KEY);
};

const writeStoredValue = (value: string): Promise<void> => {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(PROFILE_STORAGE_KEY, value);
    return Promise.resolve();
  }

  return setItemAsync(PROFILE_STORAGE_KEY, value);
};

export const loadEmergencyProfile =
  async (): Promise<EmergencyProfile | null> => {
    const storedValue = await readStoredValue();
    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue);
      if (!isEmergencyProfile(parsedValue)) {
        return null;
      }

      const validation = validateEmergencyProfile(parsedValue);
      return validation.success ? validation.profile : null;
    } catch {
      return null;
    }
  };

export const saveEmergencyProfile = async (
  profile: EmergencyProfile
): Promise<void> => {
  await writeStoredValue(JSON.stringify(profile));
};
