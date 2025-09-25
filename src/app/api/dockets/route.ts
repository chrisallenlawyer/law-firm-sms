import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all dockets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get('court_id')
    
    let query = supabase
      .from('dockets')
      .select(`
        *,
        court:courts (name, address_city),
        client_assignments:client_docket_assignments (
          id,
          client:clients (first_name, last_name, phone)
        )
      `)
      .order('docket_date', { ascending: true })

    if (courtId) {
      query = query.eq('court_id', courtId)
    }

    const { data: dockets, error } = await query

    if (error) {
      console.error('Error fetching dockets:', error)
      return NextResponse.json({ error: 'Failed to fetch dockets' }, { status: 500 })
    }

    return NextResponse.json({ dockets })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new docket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      court_id, 
      docket_date, 
      docket_time, 
      judge_name, 
      docket_type, 
      description 
    } = body

    if (!court_id || !docket_date) {
      return NextResponse.json({ 
        error: 'Court and docket date are required' 
      }, { status: 400 })
    }

    const { data: docket, error } = await supabase
      .from('dockets')
      .insert({
        court_id,
        docket_date,
        docket_time: docket_time || null,
        judge_name: judge_name || null,
        docket_type: docket_type || null,
        description: description || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating docket:', error)
      return NextResponse.json({ error: 'Failed to create docket' }, { status: 500 })
    }

    return NextResponse.json({ docket }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
