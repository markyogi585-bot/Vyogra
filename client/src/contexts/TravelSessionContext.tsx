import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence, signOut as firebaseSignOut } from "firebase/auth";
import type { AuthIntent, SessionProfile } from "@/lib/travelTypes";
import { trpc } from "@/lib/trpcClient";
import { firebaseAuth } from "@/lib/firebase";
import { firebaseProfileFromUser, upsertFirebaseTravelerProfile } from "@/lib/firebaseProfile";

export type TravelerLocale = "en-IN" | "hi-IN";

type TravelSessionValue = {
  profile: SessionProfile | null;
  locale: TravelerLocale;
  setLocale: (locale: TravelerLocale) => void;
  authIntent: AuthIntent;
  authOpen: boolean;
  searchOpen: boolean;
  dateSheetOpen: boolean;
  searchQuery: string;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  completeAuth: (profile: SessionProfile) => void;
  signOut: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openDateSheet: () => void;
  closeDateSheet: () => void;
  setSearchQuery: (value: string) => void;
};

const TravelSessionContext = createContext<TravelSessionValue | null>(null);
const STORAGE_KEY = "voyagr-session-profile";
const LOCALE_STORAGE_KEY = "voyagr-preferred-locale";

// Set Firebase persistence once at module level (runs before any login)
if (firebaseAuth) {
  setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
    // Ignore — persistence already set or not supported
  });
}

function readStoredProfile(): SessionProfile | null {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return saved ? (JSON.parse(saved) as SessionProfile) : null;
  } catch {
    return null;
  }
}

function readStoredLocale(): TravelerLocale {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    return saved === "hi-IN" ? "hi-IN" : "en-IN";
  } catch {
    return "en-IN";
  }
}

export function TravelSessionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SessionProfile | null>(readStoredProfile);
  const [locale, setLocaleState] = useState<TravelerLocale>(readStoredLocale);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("booking");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileSyncedRef = useRef(false);

  const serverSession = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(profile?.uid),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 min cache to avoid extra Firestore reads
  });
  const remotePreferences = trpc.traveler.preferences.useQuery(undefined, {
    enabled: Boolean(profile),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const saveLocale = trpc.traveler.setLocale.useMutation();

  // Firebase Auth State Listener — source of truth for login state
  useEffect(() => {
    if (!firebaseAuth) return;

    // Check if coming back from Google redirect
    getRedirectResult(firebaseAuth).catch(() => {});

    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Preserve any existing local authenticated profile across page refresh
        const existing = readStoredProfile();
        if (existing) {
          setProfile(existing);
          return;
        }
        setProfile(null);
        profileSyncedRef.current = false;
        return;
      }

      // User is signed in
      const identity = firebaseProfileFromUser(firebaseUser);

      // Check if we already have a persisted profile with a higher role (e.g. super_admin set by admin gate)
      const existingStored = readStoredProfile();
      const ROLE_RANK: Record<string, number> = { guest: 0, user: 1, sub_admin: 2, admin: 3, super_admin: 4 };
      const storedRoleRank = ROLE_RANK[existingStored?.role ?? "guest"] ?? 0;

      // If existing profile is already an admin-level session (from RoleGate), preserve it
      if (existingStored && storedRoleRank >= ROLE_RANK["sub_admin"]) {
        setProfile(existingStored);
        setAuthOpen(false);
        return;
      }

      // Get role from custom claims
      let role: SessionProfile["role"] = "user";
      try {
        const token = await firebaseUser.getIdTokenResult(false); // false = no force refresh
        const customRole = String(token.claims.role ?? "user");
        if (["user", "sub_admin", "admin", "super_admin"].includes(customRole)) {
          role = customRole as SessionProfile["role"];
        }
      } catch {
        role = "user";
      }

      const nextProfile: SessionProfile = {
        uid: identity.uid,
        name: identity.displayName || existingStored?.name || "Har Har Mahadev Traveler",
        phone: identity.phone || existingStored?.phone || "",
        email: identity.email,
        role,
        loginMethod: identity.provider,
        emailVerified: firebaseUser.emailVerified,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setAuthOpen(false); // Auto-close auth sheet when Firebase confirms sign-in

      // Sync Firestore profile only once per session
      if (!profileSyncedRef.current) {
        profileSyncedRef.current = true;
        try {
          await upsertFirebaseTravelerProfile(identity);
        } catch {
          // Best-effort
        }
      }
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync server-side role — never downgrade admin sessions
  useEffect(() => {
    const ROLE_RANK: Record<string, number> = { guest: 0, user: 1, sub_admin: 2, admin: 3, super_admin: 4 };
    const serverRole = serverSession.data?.role;
    if (!profile || !serverRole || serverRole === profile.role) return;
    const serverRoleRank = ROLE_RANK[serverRole] ?? 0;
    const currentRoleRank = ROLE_RANK[profile.role] ?? 0;
    // Never allow server to downgrade an admin/operator session
    if (currentRoleRank >= ROLE_RANK["sub_admin"] && serverRoleRank < currentRoleRank) return;
    const nextProfile = { ...profile, role: serverRole as SessionProfile["role"] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }, [profile, serverSession.data?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync remote locale preference
  useEffect(() => {
    if (!remotePreferences.data?.locale) return;
    const remoteLocale = remotePreferences.data.locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, remoteLocale);
    setLocaleState(remoteLocale as TravelerLocale);
  }, [remotePreferences.data?.locale]);

  const setLocale = (nextLocale: TravelerLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
    if (profile) saveLocale.mutate(nextLocale);
  };

  const completeAuth = (nextProfile: SessionProfile) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setAuthOpen(false);
  };

  const signOut = async () => {
    try {
      if (firebaseAuth) await firebaseSignOut(firebaseAuth);
    } catch {
      // ignore sign-out errors
    }
    window.localStorage.removeItem(STORAGE_KEY);
    profileSyncedRef.current = false;
    setProfile(null);
  };

  const value = useMemo<TravelSessionValue>(
    () => ({
      profile,
      locale,
      setLocale,
      authOpen,
      authIntent,
      searchOpen,
      dateSheetOpen,
      searchQuery,
      openAuth: (intent = "booking") => {
        setAuthIntent(intent);
        setAuthOpen(true);
      },
      closeAuth: () => setAuthOpen(false),
      completeAuth,
      signOut,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      openDateSheet: () => setDateSheetOpen(true),
      closeDateSheet: () => setDateSheetOpen(false),
      setSearchQuery,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, locale, authOpen, authIntent, searchOpen, dateSheetOpen, searchQuery],
  );

  return <TravelSessionContext.Provider value={value}>{children}</TravelSessionContext.Provider>;
}

export function useTravelSession() {
  const context = useContext(TravelSessionContext);
  if (!context) throw new Error("useTravelSession must be used inside TravelSessionProvider");
  return context;
}
