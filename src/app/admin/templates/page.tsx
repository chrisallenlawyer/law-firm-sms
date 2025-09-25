import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TemplatesPage() {
  await requireAuth()
  const supabase = await createClient()

  // Get all SMS templates
  const { data: templates, error } = await supabase
    .from('sms_templates')
    .select(`
      *,
      creator:staff_users (name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
              <p className="text-gray-600">Create and manage message templates</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Create Template
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {templates && templates.length > 0 ? (
            templates.map((template: { id: string; name: string; message_template: string; days_before: number; is_active: boolean; created_at: string }) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {template.message_text}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {template.days_before} day{template.days_before !== 1 ? 's' : ''} before
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Created by {template.creator?.name || 'Unknown'}</span>
                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first SMS template.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Create Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sample Templates */}
        {(!templates || templates.length === 0) && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Templates</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
                <h4 className="text-md font-medium text-gray-900 mb-2">Court Reminder - 7 Days</h4>
                <p className="text-sm text-gray-600 mb-4">
                  &quot;Hello {client_name}, this is a reminder that you have a court appearance scheduled for {court_date} at {court_location}. Please arrive 15 minutes early. If you have any questions, contact our office at {phone_number}.&quot;
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    7 days before
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Sample
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
                <h4 className="text-md font-medium text-gray-900 mb-2">Court Reminder - 1 Day</h4>
                <p className="text-sm text-gray-600 mb-4">
                  &quot;URGENT: Your court appearance is tomorrow, {court_date} at {court_location}. Please arrive at {time}. Bring all required documents. Contact us immediately if you cannot attend.&quot;
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    1 day before
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Urgent
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
                <h4 className="text-md font-medium text-gray-900 mb-2">Case Update</h4>
                <p className="text-sm text-gray-600 mb-4">
                  &quot;Hello {client_name}, we have an update regarding your case {case_number}. Please call our office at {phone_number} to discuss the next steps. Thank you for your patience.&quot;
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    On demand
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    General
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
