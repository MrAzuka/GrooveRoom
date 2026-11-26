// src/context/AuthContext.tsx
// Single source of truth for who is signed in. Screens read it with useAuth().
import type { AuthError, Session } from "@supabase/supabase-js";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { supabase } from "../lib/supabase"; // null when .env is missing

// What screens get for the signed-in user; keeps Supabase's big User object out of the UI
export type AuthUser = { id: string; email: string };

// Every auth action returns a ready-to-show message, or null on success
type AuthResult = { error: string | null };

// The contract teammates code against; don't change it without telling the team
type AuthContextValue = {
  loading: boolean; // true only while restoring a saved session on launch
  user: AuthUser | null; // null = signed out
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

// Shown when this device has no Supabase config (no .env)
const NOT_CONFIGURED = "Sign-in is unavailable on this device right now.";

// Turns Supabase errors into safe messages; never says which of email or password was wrong
function friendlyError(error: AuthError, mode: "signIn" | "signUp"): string {
  // Request never reached Supabase: offline or timed out
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "Can't reach the server. Check your connection and try again.";
  }
  // Supabase rate limit
  if (error.status === 429)
    return "Too many attempts. Wait a minute and try again.";
  // Same text for unknown email and wrong password, so accounts can't be guessed
  if (mode === "signIn") return "Wrong email or password.";
  // Safe to show: says nothing about whether the email exists
  if (error.code === "weak_password") return "Choose a stronger password.";
  // Covers "already registered" without confirming the account exists
  return "Couldn't create that account. If you already have one, sign in instead.";
}

// Fallback value, used only if a component reads useAuth() outside <AuthProvider>
const signedOut: AuthContextValue = {
  loading: false,
  user: null,
  signIn: async () => ({ error: NOT_CONFIGURED }),
  signUp: async () => ({ error: NOT_CONFIGURED }),
  signOut: async () => {},
};

// The context itself; signedOut is its default value
const AuthContext = createContext<AuthContextValue>(signedOut);

// Wraps the app (in David's root layout) so every screen can call useAuth()
export function AuthProvider({ children }: { children: ReactNode }) {
  // Supabase session: holds the user and tokens; null when signed out
  const [session, setSession] = useState<Session | null>(null);
  // Start loading only if there's a client to restore from; without .env, skip straight to signed out
  const [loading, setLoading] = useState(Boolean(supabase));

  // Runs once when the app starts
  useEffect(() => {
    if (!supabase) return; // no config: stay signed out

    // Read the session saved on the phone (AsyncStorage), then stop loading either way
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    // Fires on sign-in, sign-out and token refresh; keeps every screen up to date
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );

    // Cleanup: stop listening if the provider unmounts
    return () => sub.subscription.unsubscribe();
  }, []); // empty array = run once, not on every render

  // Derive the small user object screens use; email can be missing on some providers, so default to ""
  const user: AuthUser | null = session?.user
    ? { id: session.user.id, email: session.user.email ?? "" }
    : null;

  // What every useAuth() call receives
  const value: AuthContextValue = {
    loading,
    user,

    // On success, onAuthStateChange updates session; no setSession needed here
    signIn: async (email, password) => {
      if (!supabase) return { error: NOT_CONFIGURED };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? friendlyError(error, "signIn") : null };
    },

    // With "Confirm email" off, this also signs the user in straight away
    signUp: async (email, password) => {
      if (!supabase) return { error: NOT_CONFIGURED };
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ? friendlyError(error, "signUp") : null };
    },

    // Clears the saved session; the listener then sets session to null
    signOut: async () => {
      await supabase?.auth.signOut(); // ?. = do nothing if there's no client
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook screens use: const { user, loading, signIn } = useAuth();
export const useAuth = () => useContext(AuthContext);
