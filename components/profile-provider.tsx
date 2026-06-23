"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProfile, type ProfileInput } from "@/lib/actions/profile";

interface ProfileContextValue {
  profile: ProfileInput | null;
  loaded: boolean;
  setProfile: (profile: ProfileInput | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Loads the creator profile once for the whole dashboard so every module
 *  (daily, ideas, hooks, analyzer, opportunities…) shares one voice fingerprint
 *  instead of refetching per page. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) =>
        setProfile(
          p
            ? {
                about: p.about ?? "",
                pillars: p.pillars ?? "",
                audience: p.audience ?? "",
                tone: p.tone ?? "",
                goal: p.goal ?? "",
                voiceSamples: p.voiceSamples ?? "",
              }
            : null,
        ),
      )
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loaded, setProfile }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
