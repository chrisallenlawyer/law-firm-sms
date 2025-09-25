import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch client-docket assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const docketId = searchParams.get('docket_id')
    const clientId = searchParams.get('client_id')
    
    let query = supabase
      .from('client_docket_assignments')
      .select(`
        *,
        client:clients (first_name, last_name, phone),
        docket:dockets (
          id,
          docket_date,
          docket_time,
          court:courts (name)
        )
      `)

    if (docketId) {
      query = query.eq('docket_id', docketId)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: assignments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Assign client to docket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { client_id, docket_id } = body

    if (!client_id || !docket_id) {
      return NextResponse.json({ 
        error: 'Client ID and Docket ID are required' 
      }, { status: 400 })
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('client_docket_assignments')
      .select('id')
      .eq('client_id', client_id)
      .eq('docket_id', docket_id)
      .single()

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'Client is already assigned to this docket' 
      }, { status: 400 })
    }

    const { data: assignment, error } = await supabase
      .from('client_docket_assignments')
      .insert({
        client_id,
        docket_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json({ error: 'Failed to assign client to docket' }, { status: 500 })
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
