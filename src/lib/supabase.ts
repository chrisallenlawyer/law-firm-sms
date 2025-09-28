import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need elevated permissions
// Create a function to get admin client when needed (lazy initialization)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }
  
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing')
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

