import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active_only') === 'true'

    // First check if the table exists
    const { error: tableError } = await supabase
      .from('faqs')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('Table check error:', tableError)
      return NextResponse.json({ error: 'FAQ table not found. Please run database migration.' }, { status: 500 })
    }

    let query = supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching FAQs:', error)
      return NextResponse.json({ error: `Failed to fetch FAQs: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in FAQ GET:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { question, answer, category, display_order, is_active } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question,
        answer,
        category: category || 'General',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return NextResponse.json({ error: `Failed to create FAQ: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in FAQ POST:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}
