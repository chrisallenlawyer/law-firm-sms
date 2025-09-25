import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all clients
export async function GET() {
  try {
    const supabase = await createClient()
    const query = supabase
      .from('clients')
      .select(`
        *,
        attorney:staff_users (name, email),
        docket_assignments:client_docket_assignments (
          docket:dockets (
            id,
            docket_date,
            court:courts (name)
          )
        )
      `)
      .order('created_at', { ascending: false })

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      first_name,
      last_name,
      phone,
      email,
      address_street,
      address_city,
      address_state,
      address_zip,
      case_number,
      case_status,
      attorney_id
    } = body

    if (!first_name || !last_name || !phone) {
      return NextResponse.json({ 
        error: 'First name, last name, and phone are required' 
      }, { status: 400 })
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        first_name,
        last_name,
        phone,
        email: email || null,
        address_street: address_street || null,
        address_city: address_city || null,
        address_state: address_state || null,
        address_zip: address_zip || null,
        case_number: case_number || null,
        case_status: case_status || 'active',
        attorney_id: attorney_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
