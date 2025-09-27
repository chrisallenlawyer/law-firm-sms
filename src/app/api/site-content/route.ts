import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error in site-content API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('site_content')
      .insert([{
        content_key: body.content_key,
        content_value: body.content_value,
        content_type: body.content_type || 'text',
        section: body.section,
        description: body.description,
        is_active: body.is_active !== false
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (err) {
    console.error('Error in site-content API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
