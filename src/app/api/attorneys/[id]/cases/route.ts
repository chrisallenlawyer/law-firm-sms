import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: attorneyId } = await params

    // Get clients assigned to this attorney
    const { data: assignedClients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        case_number,
        charge,
        case_status,
        created_at,
        client_docket_assignments:client_docket_assignments (
          id,
          notes,
          assigned_at,
          docket:dockets (
            id,
            docket_date,
            docket_time,
            docket_type,
            judge_name,
            court:courts (name, address_city)
          )
        )
      `)
      .eq('attorney_id', attorneyId)
      .order('last_name', { ascending: true })

    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 500 })
    }

    // Get docket assignments where this attorney is primary or secondary
    const { data: docketAssignments, error: docketError } = await supabase
      .from('docket_attorneys')
      .select(`
        id,
        attorney_role,
        notes,
        assigned_at,
        client_docket_assignment:client_docket_assignments (
          id,
          notes,
          client:clients (
            id,
            first_name,
            last_name,
            case_number,
            charge
          ),
          docket:dockets (
            id,
            docket_date,
            docket_time,
            docket_type,
            judge_name,
            court:courts (name, address_city)
          )
        )
      `)
      .eq('attorney_id', attorneyId)
      .order('assigned_at', { ascending: false })

    if (docketError) {
      return NextResponse.json({ error: docketError.message }, { status: 500 })
    }

    return NextResponse.json({
      assignedClients: assignedClients || [],
      docketAssignments: docketAssignments || []
    })
  } catch (err) {
    console.error('Error in attorney cases API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
