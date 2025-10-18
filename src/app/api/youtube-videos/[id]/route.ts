import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch a single YouTube video by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching YouTube video:', error)
      return NextResponse.json(
        { error: 'Failed to fetch YouTube video', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'YouTube video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error fetching YouTube video:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update a YouTube video
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, description, video_type, youtube_id, is_active, display_order } = body

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (video_type !== undefined) {
      if (!['video', 'playlist'].includes(video_type)) {
        return NextResponse.json(
          { error: 'video_type must be either "video" or "playlist"' },
          { status: 400 }
        )
      }
      updateData.video_type = video_type
    }
    if (youtube_id !== undefined) updateData.youtube_id = youtube_id
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    const { data, error } = await supabase
      .from('youtube_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating YouTube video:', error)
      return NextResponse.json(
        { error: 'Failed to update YouTube video', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'YouTube video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error updating YouTube video:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a YouTube video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { error } = await supabase
      .from('youtube_videos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting YouTube video:', error)
      return NextResponse.json(
        { error: 'Failed to delete YouTube video', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'YouTube video deleted successfully' })
  } catch (error) {
    console.error('Unexpected error deleting YouTube video:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

