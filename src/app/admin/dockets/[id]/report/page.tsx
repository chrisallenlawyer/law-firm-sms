import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface DocketReportPageProps {
  params: {
    id: string
  }
}

export default async function DocketReportPage({ params }: DocketReportPageProps) {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get docket information
  const { data: docket, error: docketError } = await supabase
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

  if (docketError || !docket) {
    notFound()
  }

  // Get docket attorneys for each client assignment
  const { data: docketAttorneys } = await supabase
    .from('docket_attorneys')
    .select(`
      *,
      attorney:staff_users (name),
      client_docket_assignment:client_docket_assignments (id)
    `)

  // Organize attorneys by client assignment
  const attorneysByAssignment = docketAttorneys?.reduce((acc: any, da: any) => {
    const assignmentId = da.client_docket_assignment?.id
    if (!acc[assignmentId]) {
      acc[assignmentId] = {}
    }
    acc[assignmentId][da.attorney_role] = da.attorney?.name
    return acc
  }, {}) || {}

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
              <span className="text-sm text-gray-500">Role: {user.role}</span>
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
                  {docket.client_assignments?.map((assignment: any) => {
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
