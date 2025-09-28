'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Attorney {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
}

interface AttorneyFormData {
  name: string
  email: string
  is_active: boolean
}

interface ClientCase {
  id: string
  first_name: string
  last_name: string
  case_number: string
  charge?: string
  case_status: string
  client_docket_assignments: Array<{
    docket: {
      id: string
      docket_date: string
      docket_time?: string
      docket_type?: string
      court: {
        name: string
        address_city?: string
      }
    }
  }>
}

interface DocketAssignment {
  id: string
  attorney_role: string
  notes?: string
  client_docket_assignment: {
    client: {
      id: string
      first_name: string
      last_name: string
      case_number: string
      charge?: string
    }
    docket: {
      id: string
      docket_date: string
      docket_time?: string
      docket_type?: string
      court: {
        name: string
        address_city?: string
      }
    }
  }
}

export default function AttorneysManagement() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAttorney, setEditingAttorney] = useState<Attorney | null>(null)
  const [showCasesModal, setShowCasesModal] = useState(false)
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null)
  const [attorneyCases, setAttorneyCases] = useState<{
    assignedClients: ClientCase[]
    docketAssignments: DocketAssignment[]
  }>({ assignedClients: [], docketAssignments: [] })
  const [formData, setFormData] = useState<AttorneyFormData>({
    name: '',
    email: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAttorneys()
  }, [])

  const fetchAttorneys = async () => {
    try {
      const response = await fetch('/api/attorneys')
      const data = await response.json()
      if (response.ok) {
        setAttorneys(data.attorneys)
      }
    } catch (error) {
      console.error('Error fetching attorneys:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttorneyCases = async (attorneyId: string) => {
    try {
      const response = await fetch(`/api/attorneys/${attorneyId}/cases`)
      const data = await response.json()
      if (response.ok) {
        setAttorneyCases(data)
      }
    } catch (error) {
      console.error('Error fetching attorney cases:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingAttorney ? '/api/attorneys' : '/api/attorneys'
      const method = editingAttorney ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingAttorney ? { ...formData, id: editingAttorney.id } : formData),
      })

      if (response.ok) {
        await fetchAttorneys()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error submitting attorney:', error)
      alert('An error occurred while saving the attorney.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (attorney: Attorney) => {
    setEditingAttorney(attorney)
    setFormData({
      name: attorney.name,
      email: attorney.email,
      is_active: attorney.is_active
    })
    setShowForm(true)
  }

  const handleViewCases = async (attorney: Attorney) => {
    setSelectedAttorney(attorney)
    await fetchAttorneyCases(attorney.id)
    setShowCasesModal(true)
  }

  const handleDelete = async (attorney: Attorney) => {
    if (!confirm(`Are you sure you want to delete ${attorney.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/attorneys?id=${attorney.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAttorneys()
        alert('Attorney deleted successfully.')
      } else {
        const errorData = await response.json()
        alert(`Cannot delete attorney: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting attorney:', error)
      alert('An error occurred while deleting the attorney.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      is_active: true
    })
    setEditingAttorney(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading attorneys...</div>
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
                  href="/admin/enhanced-dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Enhanced Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Attorney Management</h1>
              <p className="text-gray-600">Manage attorneys for client assignments and court appearances</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add New Attorney
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Attorneys Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Attorneys</h3>
            </div>
            
            {attorneys && attorneys.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attorney
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
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
                    {attorneys.map((attorney) => (
                      <tr key={attorney.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {attorney.name || 'Unknown Attorney'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Attorney
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attorney.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attorney.is_active !== false 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attorney.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleEdit(attorney)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleViewCases(attorney)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Cases
                          </button>
                          <button 
                            onClick={() => handleDelete(attorney)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attorneys found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first attorney.</p>
                <div className="mt-6">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add New Attorney
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attorney Information */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Attorney Roles & Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-blue-800 mb-2">Attorney Capabilities</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Can be assigned as primary or secondary in-court attorney</li>
                  <li>• Can be assigned to clients for case management</li>
                  <li>• Appears in attorney selection dropdowns</li>
                  <li>• Can have staff or admin permission levels</li>
                </ul>
              </div>
              <div>
                <h4 className="text-md font-semibold text-blue-800 mb-2">Assignment Types</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Client Attorney:</strong> Assigned to client for overall case</li>
                  <li>• <strong>Primary In-Court:</strong> Lead attorney for specific docket</li>
                  <li>• <strong>Secondary In-Court:</strong> Supporting attorney for specific docket</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Attorneys</dt>
                    <dd className="text-lg font-medium text-gray-900">{attorneys?.length || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Attorneys</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {attorneys?.filter((a) => a.is_active !== false).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Available for Assignment</dt>
                    <dd className="text-lg font-medium text-gray-900">{attorneys?.length || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Attorney Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAttorney ? 'Edit Attorney' : 'Add New Attorney'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attorney Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter attorney name"
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
                    {submitting ? 'Saving...' : editingAttorney ? 'Update' : 'Add Attorney'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Cases Modal */}
      {showCasesModal && selectedAttorney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Cases for {selectedAttorney.name}
                </h3>
                <button
                  onClick={() => setShowCasesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Assigned Clients */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Assigned Clients ({attorneyCases.assignedClients.length})</h4>
                {attorneyCases.assignedClients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Case #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Charge</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Upcoming Dockets</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attorneyCases.assignedClients.map((client) => (
                          <tr key={client.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {client.last_name}, {client.first_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {client.case_number || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {client.charge || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {client.case_status}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {client.client_docket_assignments.length} scheduled
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No clients assigned to this attorney.</p>
                )}
              </div>

              {/* Docket Assignments */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Docket Assignments ({attorneyCases.docketAssignments.length})</h4>
                {attorneyCases.docketAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Court</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attorneyCases.docketAssignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {assignment.client_docket_assignment.client.last_name}, {assignment.client_docket_assignment.client.first_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {assignment.client_docket_assignment.docket.court.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(assignment.client_docket_assignment.docket.docket_date).toLocaleDateString()}
                              {assignment.client_docket_assignment.docket.docket_time && 
                                ` at ${assignment.client_docket_assignment.docket.docket_time}`
                              }
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                assignment.attorney_role === 'primary' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {assignment.attorney_role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {assignment.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No docket assignments for this attorney.</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowCasesModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
