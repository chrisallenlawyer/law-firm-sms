import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/admin/login')
  }

  // Get user details from staff_users table
  const { data: staffUser, error: staffError } = await supabase
    .from('staff_users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (staffError || !staffUser) {
    redirect('/admin/login')
  }

  return {
    id: staffUser.id,
    email: staffUser.email,
    name: staffUser.name,
    role: staffUser.role
  }
}



