import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CampaignsPage() {
  await requireAuth()
  const supabase = await createClient()

  // Get all SMS campaigns with related data
  const { data: campaigns, error } = await supabase
    .from('sms_campaigns')
    .select(`
      *,
      docket:dockets (
        docket_date,
        docket_time,
        court:courts (name)
      ),
      template:sms_templates (name, days_before),
      created_by_user:staff_users (name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns:', error)
  }

  // Get campaign statistics
  const [
    { count: totalCampaigns },
    { count: draftCampaigns },
    { count: scheduledCampaigns },
    { count: completedCampaigns }
  ] = await Promise.all([
    supabase.from('sms_campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('sms_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('sms_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('sms_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'completed')
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SMS Campaigns</h1>
              <p className="text-gray-600">Create and manage bulk SMS campaigns</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/enhanced-dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalCampaigns || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd className="text-lg font-medium text-gray-900">{draftCampaigns || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                    <dd className="text-lg font-medium text-gray-900">{scheduledCampaigns || 0}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{completedCampaigns || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Types */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Campaign Types</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Docket-Based Campaign</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Send reminders to all clients assigned to a specific docket. Perfect for court appearance reminders.
                </p>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Create Docket Campaign →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Custom Client List</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Select specific clients manually and send them a custom message or use a template.
                </p>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Create Custom Campaign →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Court-Based Campaign</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Send messages to all clients with upcoming appearances at a specific court.
                </p>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Create Court Campaign →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Campaign History ({campaigns?.length || 0})
              </h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>All Status</option>
                  <option>Draft</option>
                  <option>Scheduled</option>
                  <option>Sending</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>

            {campaigns && campaigns.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Results
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign: { id: string; name: string; status: string; successful_sends: number; total_recipients: number; failed_sends: number; created_at: string; scheduled_for?: string; docket?: { court?: { name: string }; docket_date: string; docket_time?: string }; template?: { name: string; days_before: number }; created_by_user?: { name: string } }) => (
                      <tr key={campaign.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created by {campaign.created_by_user?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {campaign.docket ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {campaign.docket.court?.name || 'Unknown Court'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(campaign.docket.docket_date).toLocaleDateString()}
                                {campaign.docket.docket_time && ` at ${campaign.docket.docket_time}`}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Custom List</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.template ? (
                            <div>
                              <div>{campaign.template.name}</div>
                              <div className="text-xs text-gray-400">
                                {campaign.template.days_before} days before
                              </div>
                            </div>
                          ) : (
                            'Custom message'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.scheduled_for ? (
                            new Date(campaign.scheduled_for).toLocaleString()
                          ) : (
                            'Not scheduled'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campaign.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'sending'
                              ? 'bg-blue-100 text-blue-800'
                              : campaign.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : campaign.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">
                              {campaign.successful_sends}
                            </span>
                            <span className="mx-1">/</span>
                            <span className="text-sm text-gray-500">
                              {campaign.total_recipients}
                            </span>
                            {campaign.failed_sends > 0 && (
                              <span className="ml-2 text-xs text-red-500">
                                ({campaign.failed_sends} failed)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button className="text-indigo-600 hover:text-indigo-900 text-left">
                              View Details
                            </button>
                            {campaign.status === 'draft' && (
                              <button className="text-green-600 hover:text-green-900 text-left">
                                Schedule
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-900 text-left">
                              Duplicate
                            </button>
                            <button className="text-red-600 hover:text-red-900 text-left">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first SMS campaign.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Create Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
