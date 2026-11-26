// src/lib/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// null when .env is missing, so the app still runs without auth
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage, // keeps the session after the app closes
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false, // no browser URL in a native app
        },
      })
    : null;

if (!supabase) {
  console.warn(
    "Supabase not configured: copy .env.example to .env and restart Expo.",
  );
}

// only refresh tokens while the app is open
AppState.addEventListener("change", (state) => {
  if (!supabase) return;
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
