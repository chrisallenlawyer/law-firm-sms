'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface DocketReportPageProps {
  params: {
    id: string
  }
}

interface ClientAssignment {
  id: string
  notes: string
  client: {
    id: string
    first_name: string
    last_name: string
    case_number: string
    charge: string
    priors: string
    jail_bond: string
    discovery_received: boolean
    tox_received: boolean
    da_offer: string
    court_action: string
    attorney_id?: string
    attorney?: {
      id: string
      name: string
    }
  }
}

interface EditableClientData {
  charge: string
  priors: string
  jail_bond: string
  discovery_received: boolean
  tox_received: boolean
  da_offer: string
  court_action: string
  attorney_id: string
  notes: string
  primary_attorney_id: string
  secondary_attorney_id: string
}

interface Docket {
  id: string
  docket_date: string
  docket_time?: string
  judge_name?: string
  docket_type?: string
  court?: {
    name: string
    address_city?: string
  }
  client_assignments?: ClientAssignment[]
}

interface DocketAttorney {
  id: string
  attorney_role: string
  attorney?: {
    id: string
    name: string
  }
  client_docket_assignment?: {
    id: string
  }
}

interface Attorney {
  id: string
  name: string
}

export default function DocketReportPage({ params }: DocketReportPageProps) {
  const [docket, setDocket] = useState<Docket | null>(null)
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [editableData, setEditableData] = useState<Record<string, EditableClientData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [savingAll, setSavingAll] = useState(false)
  const supabase = createClient()

  const fetchDocketData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get docket information
      const { data: docketData, error: docketError } = await supabase
        .from('dockets')
        .select(`
          *,
          court:courts (name, address_city),
          client_assignments:client_docket_assignments (
            id,
            notes,
            client:clients (
              id,
              first_name,
              last_name,
              case_number,
              charge,
              priors,
              jail_bond,
              discovery_received,
              tox_received,
              da_offer,
              court_action,
              attorney:staff_users (name)
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (docketError) {
        console.error('Docket error:', docketError)
        setError(`Failed to load docket: ${docketError.message}`)
        return
      }

      if (!docketData) {
        setError('Docket not found')
        return
      }

      setDocket(docketData)

      // Get attorneys list for dropdowns
      const { data: attorneysData, error: attorneysListError } = await supabase
        .from('staff_users')
        .select('id, name')
        .eq('role', 'attorney')
        .eq('is_active', true)
        .order('name')

      if (attorneysListError) {
        console.error('Attorneys list error:', attorneysListError)
      } else {
        setAttorneys(attorneysData || [])
      }

      // Get docket attorneys for each client assignment
      const { data: docketAttorneys, error: attorneysError } = await supabase
        .from('docket_attorneys')
        .select(`
          *,
          attorney:staff_users (id, name),
          client_docket_assignment:client_docket_assignments (id)
        `)

      if (attorneysError) {
        console.error('Attorneys error:', attorneysError)
        // Don't fail the whole page for attorney data
      }

      // We'll process docket attorneys directly when initializing editable data

      // Initialize editable data for each client assignment
      const initialEditableData: Record<string, EditableClientData> = {}
      docketData.client_assignments?.forEach((assignment: ClientAssignment) => {
        const client = assignment.client
        
        // Find primary and secondary attorney IDs from docket attorneys
        let primaryAttorneyId = ''
        let secondaryAttorneyId = ''
        
        docketAttorneys?.forEach((da: DocketAttorney) => {
          if (da.client_docket_assignment?.id === assignment.id) {
            if (da.attorney_role === 'primary') {
              primaryAttorneyId = da.attorney?.id || ''
            } else if (da.attorney_role === 'secondary') {
              secondaryAttorneyId = da.attorney?.id || ''
            }
          }
        })
        
        initialEditableData[assignment.id] = {
          charge: client.charge || '',
          priors: client.priors || '',
          jail_bond: client.jail_bond || '',
          discovery_received: client.discovery_received || false,
          tox_received: client.tox_received || false,
          da_offer: client.da_offer || '',
          court_action: client.court_action || '',
          attorney_id: client.attorney_id || '',
          notes: assignment.notes || '',
          primary_attorney_id: primaryAttorneyId,
          secondary_attorney_id: secondaryAttorneyId,
        }
      })

      setEditableData(initialEditableData)
    } catch (err) {
      console.error('Error fetching docket data:', err)
      setError('An unexpected error occurred while loading the docket report.')
    } finally {
      setLoading(false)
    }
  }, [params.id, supabase])

  useEffect(() => {
    fetchDocketData()
  }, [fetchDocketData])

  const updateEditableData = (assignmentId: string, field: keyof EditableClientData, value: string | boolean) => {
    setEditableData(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value
      }
    }))
  }

  const saveClientData = async (assignmentId: string) => {
    if (!docket || !editableData[assignmentId]) return

    setSaving(prev => ({ ...prev, [assignmentId]: true }))

    try {
      const assignment = docket.client_assignments?.find(a => a.id === assignmentId)
      if (!assignment) return

      const clientData = editableData[assignmentId]
      
      console.log('Saving client data for assignment:', assignmentId, clientData)

      // Update client data in clients table
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          charge: clientData.charge,
          priors: clientData.priors,
          jail_bond: clientData.jail_bond,
          discovery_received: clientData.discovery_received,
          tox_received: clientData.tox_received,
          da_offer: clientData.da_offer,
          court_action: clientData.court_action,
          attorney_id: clientData.attorney_id || null,
        })
        .eq('id', assignment.client.id)

      if (clientError) {
        console.error('Error updating client:', clientError)
        alert('Failed to update client data')
        return
      }

      // Update assignment notes
      const { error: assignmentError } = await supabase
        .from('client_docket_assignments')
        .update({ notes: clientData.notes })
        .eq('id', assignmentId)

      if (assignmentError) {
        console.error('Error updating assignment notes:', assignmentError)
        alert('Failed to update assignment notes')
        return
      }

      // Handle docket attorney assignments (primary/secondary)
      console.log('Processing docket attorney assignments:', {
        primary: clientData.primary_attorney_id,
        secondary: clientData.secondary_attorney_id
      })
      
      // First, delete existing docket attorney assignments for this assignment
      const { error: deleteError } = await supabase
        .from('docket_attorneys')
        .delete()
        .eq('client_docket_assignment_id', assignmentId)

      if (deleteError) {
        console.error('Error deleting existing docket attorneys:', deleteError)
        // Don't fail the whole operation for this
      } else {
        console.log('Successfully deleted existing docket attorneys for assignment:', assignmentId)
      }

      // Then insert new ones if specified
      const docketAttorneyInserts = []
      if (clientData.primary_attorney_id) {
        docketAttorneyInserts.push({
          client_docket_assignment_id: assignmentId,
          docket_id: docket.id,
          attorney_id: clientData.primary_attorney_id,
          attorney_role: 'primary'
        })
      }
      if (clientData.secondary_attorney_id) {
        docketAttorneyInserts.push({
          client_docket_assignment_id: assignmentId,
          docket_id: docket.id,
          attorney_id: clientData.secondary_attorney_id,
          attorney_role: 'secondary'
        })
      }

      console.log('Docket attorney inserts to be created:', docketAttorneyInserts)

      if (docketAttorneyInserts.length > 0) {
        const { error: docketAttorneyError } = await supabase
          .from('docket_attorneys')
          .insert(docketAttorneyInserts)

        if (docketAttorneyError) {
          console.error('Error inserting docket attorneys:', docketAttorneyError)
          alert('Failed to update in-court attorneys')
          return
        } else {
          console.log('Successfully inserted docket attorneys')
        }
      }

      // Refresh the data
      await fetchDocketData()
      
    } catch (err) {
      console.error('Error saving client data:', err)
      alert('An unexpected error occurred while saving')
    } finally {
      setSaving(prev => ({ ...prev, [assignmentId]: false }))
    }
  }

  const saveAllData = async () => {
    if (!docket) return

    setSavingAll(true)

    try {
      const savePromises = Object.keys(editableData).map(assignmentId => 
        saveClientData(assignmentId)
      )

      await Promise.all(savePromises)
      
    } catch (err) {
      console.error('Error saving all data:', err)
      alert('An unexpected error occurred while saving all data')
    } finally {
      setSavingAll(false)
    }
  }

  const handlePrint = () => {
    // Hide the editable elements and show a print-friendly version
    const printWindow = window.open('', '_blank')
    if (!printWindow || !docket) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Docket Report - ${docket.court?.name} - ${new Date(docket.docket_date).toLocaleDateString()}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px;
              font-size: 12px;
            }
            h1 { 
              color: #333; 
              margin-bottom: 5px; 
              font-size: 18px;
            }
            h2 { 
              color: #666; 
              margin-bottom: 15px; 
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px; 
              text-align: left; 
              font-size: 10px;
              vertical-align: top;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
              font-size: 10px;
            }
            .header-info { margin-bottom: 20px; }
            .docket-info { 
              margin-bottom: 15px; 
              font-size: 11px;
            }
            @page { 
              size: landscape; 
              margin: 0.25in; 
            }
            @media print {
              body { margin: 0; padding: 10px; }
              table { font-size: 9px; }
              th, td { padding: 3px; font-size: 9px; }
              h1 { font-size: 16px; }
              h2 { font-size: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>Docket Report</h1>
            <h2>${docket.court?.name} - ${new Date(docket.docket_date).toLocaleDateString()}</h2>
          </div>
          
          <div class="docket-info">
            <strong>Court:</strong> ${docket.court?.name || 'Not specified'}<br/>
            <strong>Date:</strong> ${new Date(docket.docket_date).toLocaleDateString()}${docket.docket_time ? ` at ${docket.docket_time}` : ''}<br/>
            <strong>Judge:</strong> ${docket.judge_name || 'Not specified'}<br/>
            <strong>Type:</strong> ${docket.docket_type || 'Not specified'}<br/>
            <strong>Clients:</strong> ${docket.client_assignments?.length || 0} assigned
          </div>

          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Case #</th>
                <th>Charge</th>
                <th>Priors</th>
                <th>Jail/Bond</th>
                <th>Disc</th>
                <th>Tox</th>
                <th>Assigned Attorney</th>
                <th>Primary Attorney</th>
                <th>Secondary Attorney</th>
                <th>Notes</th>
                <th>DA Offer</th>
                <th>Court Action</th>
              </tr>
            </thead>
            <tbody>
              ${docket.client_assignments?.map((assignment: ClientAssignment) => {
                const client = assignment.client
                const clientData = editableData[assignment.id]
                
                // Find attorneys
                const assignedAttorney = attorneys.find(a => a.id === clientData?.attorney_id)
                const primaryAttorney = attorneys.find(a => a.id === clientData?.primary_attorney_id)
                const secondaryAttorney = attorneys.find(a => a.id === clientData?.secondary_attorney_id)
                
                return `
                  <tr>
                    <td>${client.last_name}, ${client.first_name}</td>
                    <td>${client.case_number || '-'}</td>
                    <td>${clientData?.charge || '-'}</td>
                    <td>${clientData?.priors || '-'}</td>
                    <td>${clientData?.jail_bond || '-'}</td>
                    <td>${clientData?.discovery_received ? '✓' : '-'}</td>
                    <td>${clientData?.tox_received ? '✓' : '-'}</td>
                    <td>${assignedAttorney?.name || '-'}</td>
                    <td>${primaryAttorney?.name || '-'}</td>
                    <td>${secondaryAttorney?.name || '-'}</td>
                    <td>${clientData?.notes || '-'}</td>
                    <td>${clientData?.da_offer || '-'}</td>
                    <td>${clientData?.court_action || '-'}</td>
                  </tr>
                `
              }).join('') || '<tr><td colspan="13">No clients assigned to this docket.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleDownloadPDF = () => {
    // For now, use the same print functionality but with PDF as target
    // In a production environment, you'd want to use a library like jsPDF or puppeteer
    alert('PDF download functionality requires additional setup. For now, please use Print Report and select "Save as PDF" in your browser\'s print dialog.')
    handlePrint()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading docket report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link 
                  href="/admin/dockets" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Dockets
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">Error</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Docket Report</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchDocketData()}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!docket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link 
                  href="/admin/dockets" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Dockets
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">Docket Not Found</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-500">The requested docket could not be found.</p>
          </div>
        </main>
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
                  href="/admin/dockets" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Dockets Management
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Docket Report</h1>
              <p className="text-gray-600">
                {docket.court?.name} - {new Date(docket.docket_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handlePrint()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Print Report
              </button>
              <button 
                onClick={() => handleDownloadPDF()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Docket Information */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Docket Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Court</dt>
                <dd className="mt-1 text-sm text-gray-900">{docket.court?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(docket.docket_date).toLocaleDateString()}
                  {docket.docket_time && ` at ${docket.docket_time}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Judge</dt>
                <dd className="mt-1 text-sm text-gray-900">{docket.judge_name || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{docket.docket_type || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Clients</dt>
                <dd className="mt-1 text-sm text-gray-900">{docket.client_assignments?.length || 0} assigned</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Client Report Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Client Report</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case #</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Charge</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Priors</th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Jail/<br/>Bond</th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Disc</th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Tox</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Attorney</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">In Court Attorneys</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Notes</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">DA Offer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Court Action</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {docket.client_assignments?.map((assignment: ClientAssignment) => {
                    const client = assignment.client
                    const clientData = editableData[assignment.id]
                    const isSaving = saving[assignment.id]

                    return (
                      <tr key={assignment.id} className={isSaving ? 'bg-yellow-50' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {client.last_name}, {client.first_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.case_number || '-'}
                        </td>
                        <td className="px-3 py-2 w-48">
                          <input
                            type="text"
                            value={clientData?.charge || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'charge', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                            placeholder="Enter charge"
                          />
                        </td>
                        <td className="px-3 py-2 w-48">
                          <input
                            type="text"
                            value={clientData?.priors || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'priors', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                            placeholder="Enter priors"
                          />
                        </td>
                        <td className="px-1 py-2 text-center w-12">
                          <input
                            type="text"
                            value={clientData?.jail_bond || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'jail_bond', e.target.value)}
                            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 text-center"
                            placeholder="J/B"
                            maxLength={5}
                          />
                        </td>
                        <td className="px-1 py-2 text-center w-12">
                          <input
                            type="checkbox"
                            checked={clientData?.discovery_received || false}
                            onChange={(e) => updateEditableData(assignment.id, 'discovery_received', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-1 py-2 text-center w-12">
                          <input
                            type="checkbox"
                            checked={clientData?.tox_received || false}
                            onChange={(e) => updateEditableData(assignment.id, 'tox_received', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={clientData?.attorney_id || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'attorney_id', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                          >
                            <option value="">Select attorney</option>
                            {attorneys.map(attorney => (
                              <option key={attorney.id} value={attorney.id}>
                                {attorney.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 w-32">
                          <div className="space-y-1">
                            <select
                              value={clientData?.primary_attorney_id || ''}
                              onChange={(e) => updateEditableData(assignment.id, 'primary_attorney_id', e.target.value)}
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                            >
                              <option value="">Primary</option>
                              {attorneys.map(attorney => (
                                <option key={attorney.id} value={attorney.id}>
                                  {attorney.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={clientData?.secondary_attorney_id || ''}
                              onChange={(e) => updateEditableData(assignment.id, 'secondary_attorney_id', e.target.value)}
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                            >
                              <option value="">Secondary</option>
                              {attorneys.map(attorney => (
                                <option key={attorney.id} value={attorney.id}>
                                  {attorney.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2 w-64">
                          <textarea
                            value={clientData?.notes || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'notes', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-gray-900"
                            rows={2}
                            placeholder="Notes"
                          />
                        </td>
                        <td className="px-3 py-2 w-48">
                          <textarea
                            value={clientData?.da_offer || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'da_offer', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-gray-900"
                            rows={2}
                            placeholder="DA Offer"
                          />
                        </td>
                        <td className="px-3 py-2 w-48">
                          <textarea
                            value={clientData?.court_action || ''}
                            onChange={(e) => updateEditableData(assignment.id, 'court_action', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-gray-900"
                            rows={2}
                            placeholder="Court Action"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => saveClientData(assignment.id)}
                            disabled={isSaving}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              isSaving 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {(!docket.client_assignments || docket.client_assignments.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No clients assigned to this docket.</p>
              </div>
            )}

            {docket.client_assignments && docket.client_assignments.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveAllData}
                  disabled={savingAll}
                  className={`px-6 py-2 text-sm font-medium rounded-md ${
                    savingAll 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {savingAll ? 'Saving All...' : 'Save All Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Print Styles - Using regular CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            table {
              font-size: 10px;
              page-break-inside: avoid;
            }
            th, td {
              padding: 2px 4px;
              border: 1px solid #000;
            }
            @page {
              size: landscape;
              margin: 0.5in;
            }
          }
        `
      }} />
    </div>
  )
}
