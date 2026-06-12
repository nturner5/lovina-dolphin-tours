import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
      // Return a dummy client during build time if environment variables are not loaded yet,
      // preventing Next.js static collection failures.
      if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !supabaseUrl) {
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
      }
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be defined.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        persistSession: false, // Server environment, no need to persist session
      },
    });
  }
  return supabaseClient;
}
