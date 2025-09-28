'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StaffUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff' | 'attorney' | 'client'
  is_active: boolean
  created_at: string
  last_login_at?: string
  updated_at?: string
}

interface UserFormData {
  name: string
  email: string
  role: 'admin' | 'staff' | 'attorney' | 'client'
  password: string
  is_active: boolean
}

export default function UsersManagement() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'staff',
    password: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/staff-users')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.staff)
      } else {
        console.error('Error fetching users:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = '/api/staff-users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const requestBody = editingUser 
        ? { 
            id: editingUser.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            is_active: formData.is_active
          }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        await fetchUsers()
        resetForm()
        alert(editingUser ? 'User updated successfully!' : 'User created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error submitting user:', error)
      alert('An error occurred while saving the user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user: StaffUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '', // Don't pre-fill password
      is_active: user.is_active
    })
    setShowForm(true)
  }

  const handleToggleActive = async (user: StaffUser) => {
    try {
      const response = await fetch('/api/staff-users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: !user.is_active
        }),
      })

      if (response.ok) {
        await fetchUsers()
        alert(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('An error occurred while updating the user.')
    }
  }

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone and will remove their access to the system.`)) {
      return
    }

    try {
      const response = await fetch(`/api/staff-users?id=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        alert('User deleted successfully.')
      } else {
        const errorData = await response.json()
        alert(`Cannot delete user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting the user.')
    }
  }

  const handleResetPassword = async (user: StaffUser) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return

    setSubmitting(true)

    try {
      const requestBody = {
        userId: selectedUser.id,
        newPassword: newPassword
      }
      
      console.log('Sending password reset request:', requestBody)
      
      const response = await fetch('/api/staff-users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        setShowPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
        alert(`Password updated successfully for ${selectedUser.name}!\n\nPlease share the new password securely with them.`)
        await fetchUsers() // Refresh the user list
      } else {
        const errorData = await response.json()
        console.error('Password reset error response:', errorData)
        
        if (errorData.error.includes('User not found in authentication system')) {
          const recreate = confirm(`This user exists in the database but not in the authentication system.\n\nWould you like to recreate their authentication account?\n\nThis will allow them to log in with their email and the password you just set.`)
          
          if (recreate) {
            await recreateUserAuth(selectedUser)
          }
        } else {
          alert(`Error: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Error updating password:', error)
      alert('An error occurred while updating the password.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      password: '',
      is_active: true
    })
    setEditingUser(null)
    setShowForm(false)
  }

  const recreateUserAuth = async (user: StaffUser) => {
    try {
      const response = await fetch('/api/recreate-user-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newPassword: newPassword
        }),
      })

      if (response.ok) {
        alert(`Authentication account recreated successfully for ${user.name}!\n\nThey can now log in with their email and the password you set.`)
        setShowPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
        await fetchUsers()
      } else {
        const errorData = await response.json()
        alert(`Error recreating user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error recreating user:', error)
      alert('An error occurred while recreating the user.')
    }
  }

  const resetPasswordForm = () => {
    setSelectedUser(null)
    setNewPassword('')
    setShowPasswordModal(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link 
                  href="/admin/site-dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Site Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage staff users and their roles</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add New User
              </button>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Staff Users</h3>
            </div>
            
            {users && users.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'staff'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'attorney'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role || 'staff'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active !== false 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Reset Password
                          </button>
                          <button 
                            onClick={() => handleToggleActive(user)}
                            className={user.is_active ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new user.</p>
                <div className="mt-6">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add New User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Management Info */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-red-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-red-800 mb-2">Admin</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• User management</li>
                  <li>• Site configuration</li>
                  <li>• All client and case data</li>
                </ul>
              </div>
              <div className="border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Staff</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Client management</li>
                  <li>• Court docket scheduling</li>
                  <li>• SMS campaign management</li>
                  <li>• FAQ management</li>
                </ul>
              </div>
              <div className="border border-purple-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-800 mb-2">Attorney</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Client case management</li>
                  <li>• Court appearance scheduling</li>
                  <li>• Case document access</li>
                  <li>• Client communication</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Client</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View own case information</li>
                  <li>• Update contact preferences</li>
                  <li>• View court reminders</li>
                  <li>• Limited access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter email address"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter password (optional - will use default)"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="staff">Staff</option>
                    <option value="attorney">Attorney</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reset Password for {selectedUser.name}
              </h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The user will need to use this password to log in. 
                    Make sure to share this password securely with them through a secure channel (not email or SMS).
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || newPassword.length < 6}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
