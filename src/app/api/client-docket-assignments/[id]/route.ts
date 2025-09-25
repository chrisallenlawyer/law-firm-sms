import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE - Remove client from docket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('client_docket_assignments')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error removing assignment:', error)
      return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
