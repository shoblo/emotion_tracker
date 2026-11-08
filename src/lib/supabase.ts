import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Set when the two environment variables are missing (e.g. not added in Vercel yet). */
export const configError: string | null =
  url && key
    ? null
    : "The app is not configured yet: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing.";

export const supabase = createClient(url ?? "https://example.invalid", key ?? "missing-key");
