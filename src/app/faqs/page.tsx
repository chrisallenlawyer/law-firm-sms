import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  display_order: number
  is_active: boolean
}

export default async function FAQsPage() {
  const supabase = await createClient()
  
  // Get active FAQs ordered by display_order
  const { data: faqs, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching FAQs:', error)
  }

  // Group FAQs by category
  const faqsByCategory = faqs?.reduce((acc: Record<string, FAQ[]>, faq) => {
    const category = faq.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(faq)
    return acc
  }, {}) || {}

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src="/AlabamaSeal.jpg"
                  alt="Alabama State Seal"
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Public Defender
                </h1>
                <p className="text-sm text-gray-600">
                  24th Judicial Circuit, Alabama
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link href="/#mission" className="text-gray-700 hover:text-blue-600 font-medium">
                Mission
              </Link>
              <Link href="/#contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              <Link href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our services, court appearances, and legal process.
          </p>
        </div>

        {Object.keys(faqsByCategory).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs Available</h3>
            <p className="text-gray-500">Check back later for frequently asked questions.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {category}
                </h3>
                <div className="space-y-6">
                  {categoryFaqs.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                          <h4 className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </h4>
                          <div className="flex-shrink-0">
                            <svg 
                              className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-6 pb-6">
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h3>
            <p className="text-lg text-gray-600 mb-6">
              If you couldn&apos;t find the answer you&apos;re looking for, please don&apos;t hesitate to contact us.
            </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/#contact" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              href="/" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/AlabamaSeal.jpg"
                  alt="Alabama State Seal"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h4 className="text-lg font-semibold">Public Defender</h4>
                  <p className="text-sm text-gray-400">24th Judicial Circuit</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Dedicated to providing quality legal representation to the citizens of 
                Fayette, Lamar, and Pickens Counties.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Counties Served</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Fayette County</li>
                <li>Lamar County</li>
                <li>Pickens County</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link href="/#mission" className="text-gray-400 hover:text-white">Mission</Link></li>
                <li><Link href="/#contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/admin/login" className="text-gray-400 hover:text-white">Staff Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 24th Judicial Circuit Public Defender. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
