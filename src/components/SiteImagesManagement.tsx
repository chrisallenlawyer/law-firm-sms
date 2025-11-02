'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SiteImage {
  id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  image_type: 'courthouse' | 'office' | 'general'
  alt_text: string | null
  display_order: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export default function SiteImagesManagement() {
  const [images, setImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')

  // Fetch images on mount
  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-images')
      if (!response.ok) throw new Error('Failed to fetch images')
      const result = await response.json()
      setImages(result.data || [])
    } catch (err) {
      console.error('Error fetching images:', err)
      setError('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`)
        }

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`File ${file.name} is not a supported image type.`)
        }

        // Create FormData
        const formData = new FormData()
        formData.append('file', file)
        formData.append('image_type', 'courthouse') // Default type

        // Upload file
        const response = await fetch('/api/site-images/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Upload failed')
        }
      }

      setSuccessMessage(`Successfully uploaded ${files.length} image(s)`)
      fetchImages() // Refresh the list
      
      // Reset the input
      event.target.value = ''
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    try {
      const response = await fetch(`/api/site-images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Delete failed')
      }

      setSuccessMessage('Image deleted successfully')
      fetchImages()
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || 'Failed to delete image')
    }
  }

  const handleToggleActive = async (image: SiteImage) => {
    try {
      const response = await fetch(`/api/site-images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !image.is_active }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      setSuccessMessage('Image status updated')
      fetchImages()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update image')
    }
  }

  const handleSetFeatured = async (image: SiteImage) => {
    try {
      const response = await fetch(`/api/site-images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !image.is_featured }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      setSuccessMessage('Featured status updated')
      fetchImages()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update featured status')
    }
  }

  const handleUpdateOrder = async (imageId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/site-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newOrder }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      fetchImages()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update order')
    }
  }

  const handleUpdateImageType = async (imageId: string, imageType: string) => {
    try {
      const response = await fetch(`/api/site-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_type: imageType }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      setSuccessMessage('Image type updated')
      fetchImages()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update image type')
    }
  }

  const filteredImages = filterType
    ? images.filter(img => img.image_type === filterType)
    : images

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div>
      {/* Status Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

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
                  {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, WEBP up to 5MB
                </span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Site Images ({filteredImages.length})</h3>
            <div className="flex space-x-2">
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="courthouse">Courthouse</option>
                <option value="office">Office</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading images...</p>
            </div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image) => (
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
                      <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                        {image.original_name}
                      </h4>
                      <div className="flex space-x-1 ml-2">
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
                    
                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <select
                          value={image.image_type}
                          onChange={(e) => handleUpdateImageType(image.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="courthouse">Courthouse</option>
                          <option value="office">Office</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      <div>Size: {(image.file_size / 1024).toFixed(1)} KB</div>
                      <div className="flex items-center justify-between">
                        <span>Order:</span>
                        <input
                          type="number"
                          value={image.display_order}
                          onChange={(e) => handleUpdateOrder(image.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={() => handleToggleActive(image)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs font-medium"
                      >
                        {image.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleSetFeatured(image)}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-xs font-medium"
                      >
                        {image.is_featured ? 'Unset Featured' : 'Set Featured'}
                      </button>
                      <button 
                        onClick={() => handleDelete(image.id, image.original_name)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs font-medium"
                      >
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
                <li>• <strong>Courthouse:</strong> Building exteriors and courtrooms (displayed in hero rotation)</li>
                <li>• <strong>Office:</strong> Office interiors and staff photos</li>
                <li>• <strong>General:</strong> Community photos and events</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

