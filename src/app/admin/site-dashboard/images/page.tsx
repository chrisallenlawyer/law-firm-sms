import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function ImagesManagement() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get all site images
  const { data: siteImages, error } = await supabase
    .from('site_images')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching images:', error)
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
                  href="/admin/site-dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Site Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Image Management</h1>
              <p className="text-gray-600">Manage homepage rotating images and site assets</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Upload Images
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
        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upload New Images</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop files here or click to upload
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    PNG, JPG, WEBP up to 5MB
                  </span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Site Images</h3>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  <option value="courthouse">Courthouse</option>
                  <option value="office">Office</option>
                  <option value="general">General</option>
                </select>
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Reorder Images
                </button>
              </div>
            </div>
            
            {siteImages && siteImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {siteImages.map((image: any) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                      <Image
                        src={image.file_path}
                        alt={image.alt_text || image.original_name}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {image.original_name}
                        </h4>
                        <div className="flex space-x-1">
                          {image.is_featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                          {image.is_active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        <div>Type: {image.image_type}</div>
                        <div>Size: {(image.file_size / 1024).toFixed(1)} KB</div>
                        <div>Order: {image.display_order}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs font-medium">
                          Edit
                        </button>
                        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-xs font-medium">
                          Set Featured
                        </button>
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs font-medium">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No images uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">Upload your first image to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Image Guidelines */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Recommended Specifications</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Format:</strong> JPG, PNG, or WEBP</li>
                  <li>• <strong>Size:</strong> Maximum 5MB per image</li>
                  <li>• <strong>Dimensions:</strong> 1200x800px or similar aspect ratio</li>
                  <li>• <strong>Quality:</strong> High resolution for web display</li>
                </ul>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Image Types</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Courthouse:</strong> Building exteriors and courtrooms</li>
                  <li>• <strong>Office:</strong> Office interiors and staff photos</li>
                  <li>• <strong>General:</strong> Community photos and events</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
