import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (body.content_value !== undefined) updateData.content_value = body.content_value
    if (body.content_type !== undefined) updateData.content_type = body.content_type
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.description !== undefined) updateData.description = body.description

    const { data, error } = await supabase
      .from('site_content')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (err) {
    console.error('Error in site-content PATCH API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('site_content')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (err) {
    console.error('Error in site-content DELETE API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

