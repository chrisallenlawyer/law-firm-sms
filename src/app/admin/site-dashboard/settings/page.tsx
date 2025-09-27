import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SettingsManagement() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get all site settings
  const { data: siteSettings, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('setting_key', { ascending: true })

  if (error) {
    console.error('Error fetching settings:', error)
  }

  // Group settings by type
  const settingsByType = siteSettings?.reduce((acc: Record<string, any[]>, setting: any) => {
    const type = setting.is_public ? 'public' : 'private'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(setting)
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
              <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
              <p className="text-gray-600">Configure website settings and preferences</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Add Setting
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
        {/* Public Settings */}
        {settingsByType.public && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Public Settings</h3>
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Visible to visitors
                </span>
              </div>
              <div className="space-y-4">
                {settingsByType.public.map((setting: any) => (
                  <div key={setting.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {setting.setting_key.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </h4>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {setting.setting_type}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">
                          {setting.setting_type === 'json' 
                            ? JSON.stringify(JSON.parse(setting.setting_value), null, 2)
                            : setting.setting_value
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Private Settings */}
        {settingsByType.private && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Private Settings</h3>
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Admin only
                </span>
              </div>
              <div className="space-y-4">
                {settingsByType.private.map((setting: any) => (
                  <div key={setting.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {setting.setting_key.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </h4>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {setting.setting_type}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">
                          {setting.setting_type === 'json' 
                            ? JSON.stringify(JSON.parse(setting.setting_value), null, 2)
                            : setting.setting_value
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Settings */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="24th Judicial Circuit Public Defender"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="info@24thcircuitpd.org"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="(205) 555-0123"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office Hours
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Mon-Fri: 8:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Rotation Speed (ms)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Upload Size (bytes)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="5242880"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Save Quick Settings
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Application</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Version:</strong> 1.0.0</li>
                  <li>• <strong>Framework:</strong> Next.js 15</li>
                  <li>• <strong>Database:</strong> Supabase PostgreSQL</li>
                  <li>• <strong>Environment:</strong> Production</li>
                </ul>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Authentication:</strong> Supabase Auth</li>
                  <li>• <strong>SMS:</strong> Twilio Integration</li>
                  <li>• <strong>File Upload:</strong> Image Management</li>
                  <li>• <strong>Real-time:</strong> Live Updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
