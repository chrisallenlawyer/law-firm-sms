import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Recreate authentication account for existing staff user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Get the existing staff user record
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingStaff) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    console.log('Recreating auth account for existing staff user:', existingStaff.email)

    // Create new auth user with the same email
    const supabaseAdmin = getSupabaseAdmin()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: existingStaff.email,
      password: newPassword,
      email_confirm: true,
      user_metadata: { name: existingStaff.name, role: existingStaff.role }
    })

    if (authError) {
      console.error('Error creating new auth user:', authError)
      return NextResponse.json({ 
        error: `Failed to create new authentication account: ${authError.message}` 
      }, { status: 400 })
    }

    console.log('New auth user created with ID:', authData.user.id)

    // Update all foreign key references to point to the new auth user
    // 1. Update clients.attorney_id
    const { error: clientsError } = await supabase
      .from('clients')
      .update({ attorney_id: authData.user.id })
      .eq('attorney_id', existingStaff.id)
      
    if (clientsError) {
      console.log('Error updating clients:', clientsError)
    } else {
      console.log('Updated client attorney references')
    }
    
    // 2. Update docket_attorneys.attorney_id
    const { error: docketAttorneysError } = await supabase
      .from('docket_attorneys')
      .update({ attorney_id: authData.user.id })
      .eq('attorney_id', existingStaff.id)
      
    if (docketAttorneysError) {
      console.log('Error updating docket attorneys:', docketAttorneysError)
    } else {
      console.log('Updated docket attorney references')
    }

    // 3. Update docket_attorneys.assigned_by
    const { error: docketAttorneysAssignedByError } = await supabase
      .from('docket_attorneys')
      .update({ assigned_by: authData.user.id })
      .eq('assigned_by', existingStaff.id)
      
    if (docketAttorneysAssignedByError) {
      console.log('Error updating docket attorneys assigned_by:', docketAttorneysAssignedByError)
    } else {
      console.log('Updated docket attorney assigned_by references')
    }

    // 4. Update dockets.created_by
    const { error: docketsCreatedByError } = await supabase
      .from('dockets')
      .update({ created_by: authData.user.id })
      .eq('created_by', existingStaff.id)
      
    if (docketsCreatedByError) {
      console.log('Error updating dockets created_by:', docketsCreatedByError)
    } else {
      console.log('Updated docket created_by references')
    }

    // 5. Update sms_templates.created_by
    const { error: smsTemplatesCreatedByError } = await supabase
      .from('sms_templates')
      .update({ created_by: authData.user.id })
      .eq('created_by', existingStaff.id)
      
    if (smsTemplatesCreatedByError) {
      console.log('Error updating sms_templates created_by:', smsTemplatesCreatedByError)
    } else {
      console.log('Updated sms template created_by references')
    }

    // Delete the old staff user record first (this should work now that foreign keys are updated)
    const { error: deleteError } = await supabase
      .from('staff_users')
      .delete()
      .eq('id', existingStaff.id)

    if (deleteError) {
      console.error('Error deleting old staff user record:', deleteError)
      // Clean up the new auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `Failed to delete old staff user record: ${deleteError.message}` 
      }, { status: 400 })
    }

    // Now create a new staff user record with the new auth ID
    const { data: newStaff, error: createError } = await supabase
      .from('staff_users')
      .insert({
        id: authData.user.id,
        name: existingStaff.name,
        email: existingStaff.email,
        role: existingStaff.role,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating new staff user record:', createError)
      // Clean up the new auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `Failed to create new staff user record: ${createError.message}` 
      }, { status: 400 })
    }

    console.log('Successfully recreated authentication account for user:', existingStaff.email)
    return NextResponse.json({ 
      message: 'Authentication account recreated successfully',
      user: newStaff 
    })

  } catch (error) {
    console.error('Unexpected error in recreate-user-auth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
