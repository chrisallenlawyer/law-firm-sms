import Image from 'next/image'
import Link from 'next/link'
import RotatingCourthouseImages from '@/components/RotatingCourthouseImages'
import YouTubeVideoPlayer from '@/components/YouTubeVideoPlayer'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  // Fetch site content from database
  const supabase = await createClient()
  const { data: siteContent } = await supabase
    .from('site_content')
    .select('*')
    .eq('is_active', true)

  // Helper function to get content by key with fallback
  const getContent = (key: string, fallback: string = '') => {
    const content = siteContent?.find(c => c.content_key === key)
    return content?.content_value || fallback
  }

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
              <Link href="#mission" className="text-gray-700 hover:text-blue-600 font-medium">
                Mission
              </Link>
              <Link href="/faqs" className="text-gray-700 hover:text-blue-600 font-medium">
                FAQs
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              <Link href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                {getContent('hero_title', 'Protecting Your Rights')}
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {getContent('hero_subtitle', 'Dedicated legal representation for Fayette, Lamar, and Pickens Counties')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/team" 
                  className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {getContent('hero_cta_primary', 'Meet Our Team')}
                </Link>
                <Link 
                  href="#mission" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
                >
                  {getContent('hero_cta_secondary', 'Learn More')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <RotatingCourthouseImages />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Find answers to common questions about our services and legal process.
            </p>
            <Link 
              href="/faqs" 
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View All FAQs
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {getContent('mission_title', 'Our Mission')}
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {getContent('mission_text', 'To professionally and diligently represent clients in the community who are unable to pay for an attorney.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {getContent('office_fayette_name', 'Fayette County Office')}
              </h4>
              <div className="text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: getContent('office_fayette_address', 'Fayette County Courthouse<br />Fayette, Alabama') }} />
                <span className="text-sm text-gray-500">{getContent('office_fayette_phone', '(205) 555-0123')}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {getContent('office_lamar_name', 'Lamar County Office')}
              </h4>
              <div className="text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: getContent('office_lamar_address', 'Lamar County Courthouse<br />Vernon, Alabama') }} />
                <span className="text-sm text-gray-500">{getContent('office_lamar_phone', '(205) 555-0124')}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {getContent('office_pickens_name', 'Pickens County Office')}
              </h4>
              <div className="text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: getContent('office_pickens_address', 'Pickens County Courthouse<br />Carrollton, Alabama') }} />
                <span className="text-sm text-gray-500">{getContent('office_pickens_phone', '(205) 555-0125')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Video Player Section */}
      <YouTubeVideoPlayer />

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {getContent('contact_title', 'Contact Information')}
            </h3>
            <p className="text-lg text-gray-600">
              {getContent('contact_subtitle', 'Need legal assistance? Contact our office for help.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Phone</h4>
              <p className="text-gray-600">{getContent('contact_phone', '(205) 555-0123')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Email</h4>
              <p className="text-gray-600">{getContent('contact_email', 'info@24thcircuitpd.org')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Office Hours</h4>
              <p className="text-gray-600">{getContent('contact_hours', 'Mon-Fri: 8:00 AM - 5:00 PM')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
                {getContent('footer_description', 'Dedicated to providing quality legal representation to the citizens of Fayette, Lamar, and Pickens Counties.')}
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
                <li><Link href="#mission" className="text-gray-400 hover:text-white">Mission</Link></li>
                <li><Link href="/faqs" className="text-gray-400 hover:text-white">FAQs</Link></li>
                <li><Link href="#contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/admin/login" className="text-gray-400 hover:text-white">Staff Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>{getContent('footer_copyright', '© 2024 24th Judicial Circuit Public Defender. All rights reserved.')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}