import { requireAuth } from '@/lib/auth'
import FAQsManagement from '@/components/FAQsManagement'
import Link from 'next/link'

export default async function SiteDashboardFAQs() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link 
                  href="/" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Home
                </Link>
                <Link 
                  href="/admin/site-dashboard" 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Site Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
              <p className="text-gray-600">Manage frequently asked questions for the public website</p>
            </div>
            <div className="flex items-center space-x-4">
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
        <FAQsManagement />
      </main>
    </div>
  )
}



