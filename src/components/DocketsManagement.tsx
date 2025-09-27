'use client'

import { useState, useEffect } from 'react'

interface Court {
  id: string
  name: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
}

interface ClientDocketAssignment {
  id: string
  client: Client
}

interface Docket {
  id: string
  court_id: string
  docket_date: string
  docket_time?: string
  judge_name?: string
  docket_type?: string
  description?: string
  is_active: boolean
  created_at: string
  court?: {
    name: string
    address_city?: string
  }
  client_assignments?: ClientDocketAssignment[]
}

interface DocketFormData {
  court_id: string
  docket_date: string
  docket_time: string
  judge_name: string
  docket_type: string
  description: string
}

export default function DocketsManagement() {
  const [dockets, setDockets] = useState<Docket[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingDocket, setEditingDocket] = useState<Docket | null>(null)
  const [selectedDocketId, setSelectedDocketId] = useState<string>('')
  const [formData, setFormData] = useState<DocketFormData>({
    court_id: '',
    docket_date: '',
    docket_time: '09:00',
    judge_name: '',
    docket_type: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [docketsResponse, courtsResponse, clientsResponse] = await Promise.all([
        fetch('/api/dockets'),
        fetch('/api/courts'),
        fetch('/api/clients')
      ])

      const docketsData = await docketsResponse.json()
      const courtsData = await courtsResponse.json()
      const clientsData = await clientsResponse.json()

      if (docketsResponse.ok) {
        setDockets(docketsData.dockets)
      }
      if (courtsResponse.ok) {
        setCourts(courtsData.courts)
      }
      if (clientsResponse.ok) {
        setClients(clientsData.clients)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingDocket ? `/api/dockets/${editingDocket.id}` : '/api/dockets'
      const method = editingDocket ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        resetForm()
        alert(editingDocket ? 'Docket updated successfully!' : 'Docket scheduled successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('An error occurred while saving the docket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (docket: Docket) => {
    setEditingDocket(docket)
    setFormData({
      court_id: docket.court_id,
      docket_date: docket.docket_date,
      docket_time: docket.docket_time || '09:00',
      judge_name: docket.judge_name || '',
      docket_type: docket.docket_type || '',
      description: docket.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (docketId: string, courtName: string, docketDate: string) => {
    if (!confirm(`Are you sure you want to delete the docket for ${courtName} on ${new Date(docketDate + 'T00:00:00').toLocaleDateString()}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/dockets/${docketId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        alert('Docket deleted successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting docket:', error)
      alert('An error occurred while deleting the docket')
    }
  }

  const handleAssignClients = (docketId: string) => {
    setSelectedDocketId(docketId)
    setShowAssignmentForm(true)
  }

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/client-docket-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: (e.target as HTMLFormElement).client_id.value,
          docket_id: selectedDocketId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        setShowAssignmentForm(false)
        alert('Client assigned to docket successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('An error occurred while assigning client to docket')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      court_id: '',
      docket_date: '',
      docket_time: '09:00',
      judge_name: '',
      docket_type: '',
      description: ''
    })
    setEditingDocket(null)
    setShowForm(false)
  }

  const getDaysUntil = (date: string) => {
    const docketDate = new Date(date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison
    const days = Math.ceil((docketDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getUrgencyClass = (days: number) => {
    if (days < 0) return 'bg-gray-100 text-gray-800'
    if (days <= 3) return 'bg-red-100 text-red-800'
    if (days <= 7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading dockets...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Docket Management</h1>
          <p className="text-gray-600">Schedule dockets and manage client assignments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Schedule New Docket
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-black mb-4">
                {editingDocket ? 'Edit Docket' : 'Schedule New Docket'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Court *</label>
                  <select
                    required
                    value={formData.court_id}
                    onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  >
                    <option value="">Select a court</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Docket Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.docket_date}
                    onChange={(e) => setFormData({ ...formData, docket_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Docket Time</label>
                  <input
                    type="time"
                    value={formData.docket_time}
                    onChange={(e) => setFormData({ ...formData, docket_time: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Judge Name</label>
                  <input
                    type="text"
                    value={formData.judge_name}
                    onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="Hon. Judge Smith"
                    style={{color: 'black'}}
                  />
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Docket Type</label>
                  <select
                    value={formData.docket_type}
                    onChange={(e) => setFormData({ ...formData, docket_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  >
                    <option value="">Select type</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Civil">Civil</option>
                    <option value="Family">Family</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Probate">Probate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="Additional notes about this docket..."
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
                    {submitting ? 'Saving...' : (editingDocket ? 'Update Docket' : 'Schedule Docket')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-black mb-4">Assign Client to Docket</h3>
              
              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Client</label>
                  <select
                    name="client_id"
                    required
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {submitting ? 'Assigning...' : 'Assign to Docket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dockets Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Dockets ({dockets.length})
            </h3>
          </div>

          {dockets.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Court
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dockets.map((docket) => {
                    const daysUntil = getDaysUntil(docket.docket_date)
                    const isPast = daysUntil < 0
                    const isUrgent = daysUntil <= 3 && daysUntil > 0
                    
                    return (
                      <tr key={docket.id} className={isUrgent ? 'bg-red-50' : isPast ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {docket.court?.name || 'Unknown Court'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {docket.court?.address_city || 'No location'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(docket.docket_date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          {docket.docket_time && (
                            <div className="text-sm text-gray-500">
                              {docket.docket_time}
                            </div>
                          )}
                          <div className="text-xs mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyClass(daysUntil)}`}>
                              {isPast 
                                ? `${Math.abs(daysUntil)} days ago`
                                : daysUntil === 0
                                ? 'Today'
                                : daysUntil === 1
                                ? 'Tomorrow'
                                : `${daysUntil} days`
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {docket.judge_name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {docket.docket_type || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">
                              {docket.client_assignments?.length || 0}
                            </span>
                            <span className="ml-1 text-xs text-gray-400">clients</span>
                          </div>
                          {docket.client_assignments && docket.client_assignments.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {docket.client_assignments.slice(0, 2).map((assignment, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  {assignment.client ? 
                                    `${assignment.client.first_name} ${assignment.client.last_name}` : 
                                    'Unknown Client'
                                  }
                                </div>
                              ))}
                              {docket.client_assignments.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{docket.client_assignments.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            docket.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {docket.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button 
                              onClick={() => handleEdit(docket)}
                              className="text-indigo-600 hover:text-indigo-900 text-left"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleAssignClients(docket.id)}
                              className="text-green-600 hover:text-green-900 text-left"
                            >
                              Assign Clients
                            </button>
                            <button 
                              onClick={() => window.open(`/admin/dockets/${docket.id}/report`, '_blank')}
                              className="text-blue-600 hover:text-blue-900 text-left"
                            >
                              View Report
                            </button>
                            <button className="text-purple-600 hover:text-purple-900 text-left">
                              Send Reminders
                            </button>
                            <button 
                              onClick={() => handleDelete(docket.id, docket.court?.name || 'Unknown', docket.docket_date)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No dockets</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first docket.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Schedule Docket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
