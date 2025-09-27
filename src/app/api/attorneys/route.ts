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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('staff_users')
      .update({
        email: body.email,
        name: body.name,
        is_active: body.is_active
      })
      .eq('id', body.id)
      .eq('role', 'attorney')
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 })
    }

    return NextResponse.json({ attorney: data[0] })
  } catch (err) {
    console.error('Error in attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // First check if attorney has any assigned cases
    const { data: assignedCases, error: casesError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('attorney_id', id)

    if (casesError) {
      return NextResponse.json({ error: casesError.message }, { status: 500 })
    }

    // Check if attorney is assigned to any dockets
    const { data: docketAssignments, error: docketError } = await supabase
      .from('docket_attorneys')
      .select('id')
      .eq('attorney_id', id)

    if (docketError) {
      return NextResponse.json({ error: docketError.message }, { status: 500 })
    }

    if (assignedCases && assignedCases.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete attorney. They have ${assignedCases.length} assigned client(s). Please reassign clients first.`,
        assignedCases: assignedCases
      }, { status: 400 })
    }

    if (docketAssignments && docketAssignments.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete attorney. They have ${docketAssignments.length} docket assignment(s). Please remove docket assignments first.`,
        docketAssignments: docketAssignments
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('staff_users')
      .delete()
      .eq('id', id)
      .eq('role', 'attorney')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
