import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all courts
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courts:', error)
      return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 })
    }

    return NextResponse.json({ courts })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new court
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      name, 
      address_street, 
      address_city, 
      address_state, 
      address_zip, 
      phone, 
      email, 
      website 
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Court name is required' }, { status: 400 })
    }

    const { data: court, error } = await supabase
      .from('courts')
      .insert({
        name,
        address_street: address_street || null,
        address_city: address_city || null,
        address_state: address_state || null,
        address_zip: address_zip || null,
        phone: phone || null,
        email: email || null,
        website: website || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating court:', error)
      return NextResponse.json({ error: 'Failed to create court' }, { status: 500 })
    }

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


