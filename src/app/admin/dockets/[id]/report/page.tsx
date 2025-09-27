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
    attorney?: {
      name: string
    }
  }
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
    name: string
  }
  client_docket_assignment?: {
    id: string
  }
}

export default function DocketReportPage({ params }: DocketReportPageProps) {
  const [docket, setDocket] = useState<Docket | null>(null)
  const [attorneysByAssignment, setAttorneysByAssignment] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

      // Get docket attorneys for each client assignment
      const { data: docketAttorneys, error: attorneysError } = await supabase
        .from('docket_attorneys')
        .select(`
          *,
          attorney:staff_users (name),
          client_docket_assignment:client_docket_assignments (id)
        `)

      if (attorneysError) {
        console.error('Attorneys error:', attorneysError)
        // Don't fail the whole page for attorney data
      }

      // Organize attorneys by client assignment
      const attorneysByAssignment = docketAttorneys?.reduce((acc: Record<string, Record<string, string>>, da: DocketAttorney) => {
        const assignmentId = da.client_docket_assignment?.id
        if (assignmentId) {
          if (!acc[assignmentId]) {
            acc[assignmentId] = {}
          }
          if (da.attorney?.name) {
            acc[assignmentId][da.attorney_role] = da.attorney.name
          }
        }
        return acc
      }, {}) || {}

      setAttorneysByAssignment(attorneysByAssignment)
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
              <h1 className="text-3xl font-bold text-gray-900">Docket Client Report</h1>
              <p className="text-gray-600">
                {docket.court?.name} - {new Date(docket.docket_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Print Report
              </button>
              <button 
                onClick={() => window.print()}
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charge</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priors</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jail/Bond</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discovery</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tox</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Attorney</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Court Attorneys</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DA Offer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {docket.client_assignments?.map((assignment: ClientAssignment) => {
                    const client = assignment.client
                    const assignmentAttorneys = attorneysByAssignment[assignment.id] || {}
                    const inCourtAttorneys = [
                      assignmentAttorneys.primary,
                      assignmentAttorneys.secondary
                    ].filter(Boolean).join(', ') || 'None assigned'

                    return (
                      <tr key={assignment.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {client.last_name}, {client.first_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.case_number || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.charge || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.priors || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.jail_bond || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.discovery_received ? '✓' : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.tox_received ? '✓' : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {client.attorney?.name || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {inCourtAttorneys}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {assignment.notes || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {client.da_offer || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {client.court_action || '-'}
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
