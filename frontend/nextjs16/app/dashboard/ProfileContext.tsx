"use client";

import { createContext, useContext, useState } from "react";
import type { Profile } from "@/lib/types";

type ProfileContextValue = {
  profile: Profile;
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState(profile);
  return (
    <ProfileContext.Provider value={{ profile: current, setProfile: setCurrent }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
