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
    
    if (body.image_type !== undefined) updateData.image_type = body.image_type
    if (body.alt_text !== undefined) updateData.alt_text = body.alt_text
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured

    const { data, error } = await supabase
      .from('site_images')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (err) {
    console.error('Error in site-images PATCH API:', err)
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

    // First, get the image to get the file path
    const { data: image, error: fetchError } = await supabase
      .from('site_images')
      .select('file_path, filename')
      .eq('id', id)
      .single()

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('site_images')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Try to delete from storage if it's in a storage bucket
    // File paths starting with bucket name will be in storage
    if (image.file_path.startsWith('site-images/')) {
      try {
        const { error: storageError } = await supabase.storage
          .from('site-images')
          .remove([image.filename])

        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Don't fail the request if storage delete fails
        }
      } catch (storageErr) {
        console.error('Storage deletion error:', storageErr)
      }
    }

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (err) {
    console.error('Error in site-images DELETE API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

