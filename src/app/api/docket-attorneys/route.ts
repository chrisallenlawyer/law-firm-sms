import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const docketId = searchParams.get('docket_id')
    const clientAssignmentId = searchParams.get('client_assignment_id')

    let query = supabase
      .from('docket_attorneys')
      .select(`
        *,
        attorney:staff_users (id, name),
        client_docket_assignment:client_docket_assignments (id)
      `)

    if (docketId) {
      query = query.eq('docket_id', docketId)
    }
    if (clientAssignmentId) {
      query = query.eq('client_docket_assignment_id', clientAssignmentId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ docket_attorneys: data })
  } catch (err) {
    console.error('Error in docket-attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('docket_attorneys')
      .insert([{
        docket_id: body.docket_id,
        client_docket_assignment_id: body.client_docket_assignment_id,
        attorney_id: body.attorney_id,
        attorney_role: body.attorney_role,
        notes: body.notes,
        assigned_by: body.assigned_by
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ docket_attorney: data[0] })
  } catch (err) {
    console.error('Error in docket-attorneys API:', err)
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

    const { error } = await supabase
      .from('docket_attorneys')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in docket-attorneys API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


