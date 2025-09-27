import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('staff_users')
      .select('id, name, email, is_active')
      .eq('role', 'attorney')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attorneys: data })
  } catch (err) {
    console.error('Error in attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('staff_users')
      .insert([{
        email: body.email,
        name: body.name,
        role: 'attorney',
        is_active: body.is_active !== false
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attorney: data[0] })
  } catch (err) {
    console.error('Error in attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
