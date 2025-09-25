import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all staff users
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: staff, error } = await supabase
      .from('staff_users')
      .select('id, name, email, role')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
