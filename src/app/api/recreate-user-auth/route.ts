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
    const { error: clientsError } = await supabase
      .from('clients')
      .update({ attorney_id: authData.user.id })
      .eq('attorney_id', existingStaff.id)
      
    if (clientsError) {
      console.log('Error updating clients:', clientsError)
    } else {
      console.log('Updated client attorney references')
    }
    
    // Update docket_attorneys table as well
    const { error: docketAttorneysError } = await supabase
      .from('docket_attorneys')
      .update({ attorney_id: authData.user.id })
      .eq('attorney_id', existingStaff.id)
      
    if (docketAttorneysError) {
      console.log('Error updating docket attorneys:', docketAttorneysError)
    } else {
      console.log('Updated docket attorney references')
    }

    // Now update the staff user record with the new auth ID
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff_users')
      .update({
        id: authData.user.id,
        name: existingStaff.name,
        role: existingStaff.role,
        is_active: true
      })
      .eq('id', existingStaff.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating staff user record:', updateError)
      // Clean up the new auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `Failed to update staff user record: ${updateError.message}` 
      }, { status: 400 })
    }

    console.log('Successfully recreated authentication account for user:', existingStaff.email)
    return NextResponse.json({ 
      message: 'Authentication account recreated successfully',
      user: updatedStaff 
    })

  } catch (error) {
    console.error('Unexpected error in recreate-user-auth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
