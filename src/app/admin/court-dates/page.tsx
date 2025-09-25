import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CourtDatesPage() {
  await requireAuth()
  const supabase = await createClient()

  // Get all court dates
  const { data: courtDates, error } = await supabase
    .from('court_dates')
    .select(`
      *,
      client:clients (name, phone)
    `)
    .order('court_date', { ascending: true })

  if (error) {
    console.error('Error fetching court dates:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Court Dates</h1>
              <p className="text-gray-600">Manage upcoming court appearances</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Schedule Court Date
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Court Dates Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Court Dates ({courtDates?.length || 0})
              </h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search court dates..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Closed</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>

            {courtDates && courtDates.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Court Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Until
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case Type
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
                    {courtDates.map((courtDate: { id: string; court_date: string; court_location: string; case_type: string; client?: { name: string; phone: string } }) => {
                      const daysUntil = Math.ceil((new Date(courtDate.court_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      const isUpcoming = daysUntil > 0
                      const isUrgent = daysUntil <= 3 && daysUntil > 0
                      
                      return (
                        <tr key={courtDate.id} className={isUrgent ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {courtDate.client?.name || 'Unknown Client'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {courtDate.client?.phone || 'No phone'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(courtDate.court_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isUpcoming ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isUrgent 
                                  ? 'bg-red-100 text-red-800'
                                  : daysUntil <= 7
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Past due
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {courtDate.court_location || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {courtDate.case_type || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              courtDate.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : courtDate.status === 'closed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {courtDate.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Edit
                            </button>
                            <button className="text-green-600 hover:text-green-900 mr-3">
                              Send Reminder
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No court dates</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first court date.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Schedule Court Date
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
