import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffUser } from '@/types/database'

export async function getUser(): Promise<StaffUser | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get staff user data
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (staffError || !staffUser) {
      return null
    }

    return staffUser
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function requireAuth(): Promise<StaffUser> {
  const user = await getUser()
  
  if (!user) {
    redirect('/admin/login')
  }
  
  return user
}

export async function requireAdmin(): Promise<StaffUser> {
  const user = await requireAuth()
  
  if (user.role !== 'admin') {
    redirect('/admin/dashboard')
  }
  
  return user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
