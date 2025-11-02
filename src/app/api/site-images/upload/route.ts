import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('image_type') as string || 'courthouse'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('site-images')
      .getPublicUrl(filename)

    const publicUrl = publicUrlData.publicUrl

    // Get the highest display order to add this image at the end
    const { data: maxOrderData } = await supabase
      .from('site_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = maxOrderData && maxOrderData.length > 0 
      ? maxOrderData[0].display_order + 1 
      : 1

    // Insert record into database
    const { data: dbData, error: dbError } = await supabase
      .from('site_images')
      .insert([{
        filename: filename,
        original_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        image_type: imageType,
        alt_text: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
        display_order: nextOrder,
        is_active: true,
        is_featured: false,
      }])
      .select()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage.from('site-images').remove([filename])
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: dbData[0],
      message: 'Image uploaded successfully' 
    })
  } catch (err: any) {
    console.error('Error in site-images upload API:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

