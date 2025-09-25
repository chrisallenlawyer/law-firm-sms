import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: client, error } = await supabase
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
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .update({
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
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // First check if client has any docket assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('client_docket_assignments')
      .select('id')
      .eq('client_id', params.id)
      .limit(1)

    if (assignmentsError) {
      console.error('Error checking assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to check client usage' }, { status: 500 })
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client that has docket assignments. Remove assignments first.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
