import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ContentManagement() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get all site content
  const { data: siteContent, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section', { ascending: true })

  if (error) {
    console.error('Error fetching content:', error)
  }

  // Group content by section
  const contentBySection = siteContent?.reduce((acc: Record<string, any[]>, content: any) => {
    if (!acc[content.section]) {
      acc[content.section] = []
    }
    acc[content.section].push(content)
    return acc
  }, {} as Record<string, any[]>) || {}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link 
                  href="/admin/site-dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Site Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
              <p className="text-gray-600">Edit homepage text, addresses, and contact information</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Preview Changes
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
        {/* Content Sections */}
        {Object.entries(contentBySection).map(([section, contents]: [string, any]) => (
          <div key={section} className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 capitalize">
                {section.replace('_', ' ')} Section
              </h3>
              <div className="space-y-4">
                {contents.map((content: any) => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {content.content_key.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </h4>
                        <p className="text-xs text-gray-500">{content.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          content.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {content.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {content.content_type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      {content.content_type === 'html' ? (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div 
                            className="text-sm text-gray-700"
                            dangerouslySetInnerHTML={{ __html: content.content_value }}
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">{content.content_value}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Last updated: {new Date(content.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Edit
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium">
                Edit Hero Section
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium">
                Update Contact Info
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-sm font-medium">
                Edit Office Locations
              </button>
            </div>
          </div>
        </div>

        {/* Content Guidelines */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Content Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep text concise and professional</li>
                  <li>• Use clear, simple language</li>
                  <li>• Ensure contact information is accurate</li>
                  <li>• Test all links and phone numbers</li>
                </ul>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Content Types</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Text:</strong> Plain text content</li>
                  <li>• <strong>HTML:</strong> Formatted content with HTML tags</li>
                  <li>• <strong>JSON:</strong> Structured data for complex content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
