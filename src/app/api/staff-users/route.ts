import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch all staff users
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: staff, error } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new staff user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, role, password } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const supabaseAdmin = getSupabaseAdmin()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'temp123!', // Default password if not provided
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: `Failed to create user account: ${authError.message}` }, { status: 400 })
    }

    // Check if staff user already exists (for recreation scenarios)
    const { data: existingStaff } = await supabase
      .from('staff_users')
      .select('id')
      .eq('email', email)
      .single()

    let staffData
    if (existingStaff) {
      // If staff user already exists, return error - they should use the recreate endpoint
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: 'User already exists. Use the password reset feature to recreate their authentication account.' 
      }, { status: 400 })
    } else {
      // Create new staff user record
      const { data: newStaff, error: staffError } = await supabase
        .from('staff_users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          is_active: true
        })
        .select()
        .single()

      if (staffError) {
        console.error('Error creating staff user:', staffError)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: 'Failed to create staff user record' }, { status: 400 })
      }
      staffData = newStaff
    }

    return NextResponse.json({ user: staffData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update staff user
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, email, role, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Update staff user record
    const { data: staffData, error: staffError } = await supabase
      .from('staff_users')
      .update({
        name,
        email,
        role,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (staffError) {
      console.error('Error updating staff user:', staffError)
      return NextResponse.json({ error: 'Failed to update staff user' }, { status: 400 })
    }

    return NextResponse.json({ user: staffData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete staff user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if trying to delete self
    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete from staff_users table
    const { error: staffError } = await supabase
      .from('staff_users')
      .delete()
      .eq('id', userId)

    if (staffError) {
      console.error('Error deleting staff user:', staffError)
      return NextResponse.json({ error: 'Failed to delete staff user record' }, { status: 400 })
    }

    // Delete from auth
    const supabaseAdmin = getSupabaseAdmin()
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 400 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update user password (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('PATCH request body:', body)
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      console.log('Unauthorized: No auth user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Auth user:', authUser.email)

    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      console.log('Missing required fields:', { userId: !!userId, newPassword: !!newPassword })
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      console.log('Password too short:', newPassword.length)
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    console.log('Attempting to update password for user:', userId)

    // Update user password using admin API
    const supabaseAdmin = getSupabaseAdmin()
    
    // First, verify the user exists in Auth
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !targetUser.user) {
      console.error('User not found in Auth:', getUserError)
      return NextResponse.json({ 
        error: `User not found in authentication system. This user may need to be recreated.` 
      }, { status: 400 })
    }
    
    console.log('User found in Auth, proceeding with password update')
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}` }, { status: 400 })
    }

    console.log('Password updated successfully for user:', userId)
    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Unexpected error in PATCH:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
