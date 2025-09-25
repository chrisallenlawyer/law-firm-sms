'use client'

import { useState, useEffect } from 'react'

interface StaffUser {
  id: string
  name: string
  email: string
}

interface Docket {
  id: string
  docket_date: string
  docket_time?: string
  court?: {
    name: string
  }
}

interface ClientDocketAssignment {
  id: string
  docket: Docket
}

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  case_number?: string
  case_status: string
  attorney_id?: string
  created_at: string
  attorney?: StaffUser
  docket_assignments?: ClientDocketAssignment[]
}

interface ClientFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  case_number: string
  case_status: string
  attorney_id: string
}

interface AssignmentFormData {
  client_id: string
  docket_id: string
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [dockets, setDockets] = useState<Docket[]>([])
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showClientForm, setShowClientForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    case_number: '',
    case_status: 'active',
    attorney_id: ''
  })
  const [assignmentFormData, setAssignmentFormData] = useState<AssignmentFormData>({
    client_id: '',
    docket_id: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientsResponse, docketsResponse, staffResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/dockets'),
        fetch('/api/staff-users')
      ])

      const clientsData = await clientsResponse.json()
      const docketsData = await docketsResponse.json()
      const staffData = await staffResponse.json()

      if (clientsResponse.ok) {
        setClients(clientsData.clients)
      }
      if (docketsResponse.ok) {
        setDockets(docketsData.dockets)
      }
      if (staffResponse.ok) {
        setStaff(staffData.staff)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientFormData),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        resetClientForm()
        alert(editingClient ? 'Client updated successfully!' : 'Client created successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('An error occurred while saving the client')
    } finally {
      setSubmitting(false)
    }
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
        body: JSON.stringify(assignmentFormData),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        resetAssignmentForm()
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

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email || '',
      address_street: client.address_street || '',
      address_city: client.address_city || '',
      address_state: client.address_state || '',
      address_zip: client.address_zip || '',
      case_number: client.case_number || '',
      case_status: client.case_status,
      attorney_id: client.attorney_id || ''
    })
    setShowClientForm(true)
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete "${clientName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        await fetchData()
        alert('Client deleted successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('An error occurred while deleting the client')
    }
  }

  const handleAssignToDocket = (clientId: string) => {
    setAssignmentFormData({
      client_id: clientId,
      docket_id: ''
    })
    setShowAssignmentForm(true)
  }

  const resetClientForm = () => {
    setClientFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      case_number: '',
      case_status: 'active',
      attorney_id: ''
    })
    setEditingClient(null)
    setShowClientForm(false)
  }

  const resetAssignmentForm = () => {
    setAssignmentFormData({
      client_id: '',
      docket_id: ''
    })
    setShowAssignmentForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading clients...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage client information and docket assignments</p>
        </div>
        <button
          onClick={() => setShowClientForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add New Client
        </button>
      </div>

      {/* Add/Edit Client Form Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-black mb-4">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={clientFormData.first_name}
                      onChange={(e) => setClientFormData({ ...clientFormData, first_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="Enter first name"
                      style={{color: 'black'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={clientFormData.last_name}
                      onChange={(e) => setClientFormData({ ...clientFormData, last_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="Enter last name"
                      style={{color: 'black'}}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Phone *</label>
                    <input
                      type="tel"
                      required
                      value={clientFormData.phone}
                      onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="(555) 123-4567"
                      style={{color: 'black'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Email</label>
                    <input
                      type="email"
                      value={clientFormData.email}
                      onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="client@example.com"
                      style={{color: 'black'}}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Street Address</label>
                  <input
                    type="text"
                    value={clientFormData.address_street}
                    onChange={(e) => setClientFormData({ ...clientFormData, address_street: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    placeholder="123 Main Street"
                    style={{color: 'black'}}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>City</label>
                    <input
                      type="text"
                      value={clientFormData.address_city}
                      onChange={(e) => setClientFormData({ ...clientFormData, address_city: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="City"
                      style={{color: 'black'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>State</label>
                    <input
                      type="text"
                      value={clientFormData.address_state}
                      onChange={(e) => setClientFormData({ ...clientFormData, address_state: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="State"
                      style={{color: 'black'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>ZIP Code</label>
                    <input
                      type="text"
                      value={clientFormData.address_zip}
                      onChange={(e) => setClientFormData({ ...clientFormData, address_zip: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="12345"
                      style={{color: 'black'}}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Case Number</label>
                    <input
                      type="text"
                      value={clientFormData.case_number}
                      onChange={(e) => setClientFormData({ ...clientFormData, case_number: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      placeholder="Case number"
                      style={{color: 'black'}}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Attorney</label>
                    <select
                      value={clientFormData.attorney_id}
                      onChange={(e) => setClientFormData({ ...clientFormData, attorney_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                      style={{color: 'black'}}
                    >
                      <option value="">Select attorney</option>
                      {staff.map((attorney) => (
                        <option key={attorney.id} value={attorney.id}>
                          {attorney.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Case Status</label>
                  <select
                    value={clientFormData.case_status}
                    onChange={(e) => setClientFormData({ ...clientFormData, case_status: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetClientForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
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
                    value={assignmentFormData.client_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, client_id: e.target.value })}
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

                <div>
                  <label className="block text-base font-extrabold text-black" style={{color: 'black', fontWeight: '900'}}>Docket</label>
                  <select
                    value={assignmentFormData.docket_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, docket_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md text-sm text-black bg-white"
                    style={{color: 'black'}}
                  >
                    <option value="">Select docket</option>
                    {dockets.map((docket) => (
                      <option key={docket.id} value={docket.id}>
                        {new Date(docket.docket_date + 'T00:00:00').toLocaleDateString()} - {docket.court?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetAssignmentForm}
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

      {/* Clients Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Clients ({clients.length})
            </h3>
          </div>

          {clients.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dockets
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
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.attorney?.name || 'No attorney assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.phone}</div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.address_street && (
                          <div>{client.address_street}</div>
                        )}
                        {(client.address_city || client.address_state || client.address_zip) && (
                          <div>
                            {client.address_city && `${client.address_city}, `}
                            {client.address_state && `${client.address_state} `}
                            {client.address_zip}
                          </div>
                        )}
                        {!client.address_street && !client.address_city && (
                          <span className="text-gray-400">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{client.case_number || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.docket_assignments && client.docket_assignments.length > 0 ? (
                          <div className="space-y-1">
                            {client.docket_assignments.slice(0, 2).map((assignment, index) => (
                              <div key={index} className="text-xs">
                                <div className="font-medium">{assignment.docket?.court?.name}</div>
                                <div className="text-gray-400">
                                  {assignment.docket?.docket_date && new Date(assignment.docket.docket_date + 'T00:00:00').toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                            {client.docket_assignments.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{client.docket_assignments.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No dockets</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.case_status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : client.case_status === 'closed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.case_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button 
                            onClick={() => handleEditClient(client)}
                            className="text-indigo-600 hover:text-indigo-900 text-left"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleAssignToDocket(client.id)}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Assign to Docket
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id, `${client.first_name} ${client.last_name}`)}
                            className="text-red-600 hover:text-red-900 text-left"
                          >
                            Delete
                          </button>
                        </div>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowClientForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
