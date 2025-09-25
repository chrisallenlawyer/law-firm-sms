'use client'

import { useState, useEffect } from 'react'

interface Court {
  id: string
  name: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  phone?: string
  email?: string
  website?: string
  is_active: boolean
  created_at: string
}

interface CourtFormData {
  name: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  phone: string
  email: string
  website: string
}

export default function CourtsManagement() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [formData, setFormData] = useState<CourtFormData>({
    name: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    phone: '',
    email: '',
    website: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch courts on component mount
  useEffect(() => {
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      if (response.ok) {
        setCourts(data.courts)
      } else {
        console.error('Error fetching courts:', data.error)
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingCourt ? `/api/courts/${editingCourt.id}` : '/api/courts'
      const method = editingCourt ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh the courts list
        await fetchCourts()
        // Reset form
        resetForm()
        alert(editingCourt ? 'Court updated successfully!' : 'Court created successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('An error occurred while saving the court')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      address_street: court.address_street || '',
      address_city: court.address_city || '',
      address_state: court.address_state || '',
      address_zip: court.address_zip || '',
      phone: court.phone || '',
      email: court.email || '',
      website: court.website || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (courtId: string, courtName: string) => {
    if (!confirm(`Are you sure you want to delete "${courtName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        await fetchCourts()
        alert('Court deleted successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting court:', error)
      alert('An error occurred while deleting the court')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      phone: '',
      email: '',
      website: ''
    })
    setEditingCourt(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading courts...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
          <p className="text-gray-600">Manage court information and settings</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add New Court
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-black mb-4">
                {editingCourt ? 'Edit Court' : 'Add New Court'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Court Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white placeholder-gray-500"
                    placeholder="Enter court name"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Street Address</label>
                  <input
                    type="text"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="123 Main Street"
                    style={{color: 'black'}}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>City</label>
                    <input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="City"
                    style={{color: 'black'}}
                  />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>State</label>
                    <input
                      type="text"
                      value={formData.address_state}
                      onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="State"
                    style={{color: 'black'}}
                  />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>ZIP Code</label>
                  <input
                    type="text"
                    value={formData.address_zip}
                    onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="12345"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="(555) 123-4567"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="court@example.com"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="https://example.com"
                    style={{color: 'black'}}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingCourt ? 'Update Court' : 'Create Court')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Courts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {courts.length > 0 ? (
          courts.map((court) => (
            <div key={court.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {court.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {court.address_street && (
                      <div>{court.address_street}</div>
                    )}
                    {(court.address_city || court.address_state || court.address_zip) && (
                      <div>
                        {court.address_city && `${court.address_city}, `}
                        {court.address_state && `${court.address_state} `}
                        {court.address_zip}
                      </div>
                    )}
                    {court.phone && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {court.phone}
                      </div>
                    )}
                    {court.email && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {court.email}
                      </div>
                    )}
                    {court.website && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        <a href={court.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    court.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {court.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => handleEdit(court)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(court.id, court.name)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(court.created_at).toLocaleDateString()}</span>
                  <a 
                    href={`/admin/dockets?court=${court.id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Dockets →
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courts</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first court.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Court
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
