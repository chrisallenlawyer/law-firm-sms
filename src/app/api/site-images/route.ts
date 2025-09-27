import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('site_images')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error in site-images API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('site_images')
      .insert([{
        filename: body.filename,
        original_name: body.original_name,
        file_path: body.file_path,
        file_size: body.file_size,
        mime_type: body.mime_type,
        image_type: body.image_type || 'general',
        alt_text: body.alt_text,
        display_order: body.display_order || 0,
        is_active: body.is_active !== false,
        is_featured: body.is_featured || false
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (err) {
    console.error('Error in site-images API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
