import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch a specific docket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data: docket, error } = await supabase
      .from('dockets')
      .select(`
        *,
        court:courts (name, address_city),
        client_assignments:client_docket_assignments (
          id,
          client:clients (first_name, last_name, phone)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching docket:', error)
      return NextResponse.json({ error: 'Docket not found' }, { status: 404 })
    }

    return NextResponse.json({ docket })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a docket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { 
      court_id, 
      docket_date, 
      docket_time, 
      judge_name, 
      docket_type, 
      description,
      is_active
    } = body

    if (!court_id || !docket_date) {
      return NextResponse.json({ 
        error: 'Court and docket date are required' 
      }, { status: 400 })
    }

    const { data: docket, error } = await supabase
      .from('dockets')
      .update({
        court_id,
        docket_date,
        docket_time: docket_time || null,
        judge_name: judge_name || null,
        docket_type: docket_type || null,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating docket:', error)
      return NextResponse.json({ error: 'Failed to update docket' }, { status: 500 })
    }

    return NextResponse.json({ docket })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a docket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // First check if docket has any client assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('client_docket_assignments')
      .select('id')
      .eq('docket_id', id)
      .limit(1)

    if (assignmentsError) {
      console.error('Error checking assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to check docket usage' }, { status: 500 })
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete docket that has assigned clients' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('dockets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting docket:', error)
      return NextResponse.json({ error: 'Failed to delete docket' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Docket deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
