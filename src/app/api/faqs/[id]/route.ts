import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching FAQ:', error)
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in FAQ GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    
    const { question, answer, category, display_order, is_active } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .update({
        question,
        answer,
        category: category || 'General',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in FAQ PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' })
  } catch (error) {
    console.error('Error in FAQ DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
