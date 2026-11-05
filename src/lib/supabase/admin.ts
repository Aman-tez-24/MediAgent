import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Note: This should ONLY be used in server environments (API routes, server actions)
// where you need to bypass Row Level Security.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
