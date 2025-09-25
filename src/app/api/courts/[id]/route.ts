import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch a specific court
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: court, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching court:', error)
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    return NextResponse.json({ court })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a court
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      website,
      is_active
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Court name is required' }, { status: 400 })
    }

    const { data: court, error } = await supabase
      .from('courts')
      .update({
        name,
        address_street: address_street || null,
        address_city: address_city || null,
        address_state: address_state || null,
        address_zip: address_zip || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating court:', error)
      return NextResponse.json({ error: 'Failed to update court' }, { status: 500 })
    }

    return NextResponse.json({ court })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a court
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // First check if court has any dockets
    const { data: dockets, error: docketsError } = await supabase
      .from('dockets')
      .select('id')
      .eq('court_id', params.id)
      .limit(1)

    if (docketsError) {
      console.error('Error checking dockets:', docketsError)
      return NextResponse.json({ error: 'Failed to check court usage' }, { status: 500 })
    }

    if (dockets && dockets.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete court that has associated dockets' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting court:', error)
      return NextResponse.json({ error: 'Failed to delete court' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Court deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
