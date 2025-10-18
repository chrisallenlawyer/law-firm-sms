import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all YouTube videos (with optional filter for active only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabase
      .from('youtube_videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching YouTube videos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch YouTube videos', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error fetching YouTube videos:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create a new YouTube video entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, video_type, youtube_id, is_active, display_order } = body

    // Validate required fields
    if (!title || !video_type || !youtube_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, video_type, and youtube_id are required' },
        { status: 400 }
      )
    }

    // Validate video_type
    if (!['video', 'playlist'].includes(video_type)) {
      return NextResponse.json(
        { error: 'video_type must be either "video" or "playlist"' },
        { status: 400 }
      )
    }

    // Get user's staff_user record
    const { data: staffUser } = await supabase
      .from('staff_users')
      .select('id')
      .eq('email', user.email)
      .single()

    const { data, error } = await supabase
      .from('youtube_videos')
      .insert({
        title,
        description: description || null,
        video_type,
        youtube_id,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
        created_by: staffUser?.id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating YouTube video:', error)
      return NextResponse.json(
        { error: 'Failed to create YouTube video', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating YouTube video:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

