'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SiteImage {
  id: string
  file_path: string
  alt_text: string | null
  original_name: string
  image_type: string
  is_active: boolean
}

const defaultImages = [
  {
    id: 'default-1',
    file_path: '',
    alt_text: 'Fayette County Courthouse',
    original_name: 'Fayette County Courthouse',
    image_type: 'courthouse',
    color: 'from-blue-600 to-blue-800',
    location: 'Fayette, Alabama'
  },
  {
    id: 'default-2',
    file_path: '',
    alt_text: 'Lamar County Courthouse',
    original_name: 'Lamar County Courthouse',
    image_type: 'courthouse',
    color: 'from-green-600 to-green-800',
    location: 'Vernon, Alabama'
  },
  {
    id: 'default-3',
    file_path: '',
    alt_text: 'Pickens County Courthouse',
    original_name: 'Pickens County Courthouse',
    image_type: 'courthouse',
    color: 'from-purple-600 to-purple-800',
    location: 'Carrollton, Alabama'
  }
]

export default function RotatingCourthouseImages() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [images, setImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [useDefaultPlaceholders, setUseDefaultPlaceholders] = useState(false)

  // Fetch images from API
  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/site-images')
        if (!response.ok) throw new Error('Failed to fetch images')
        
        const result = await response.json()
        
        // Filter for active courthouse images only
        const courthouseImages = (result.data || []).filter(
          (img: SiteImage) => img.image_type === 'courthouse' && img.is_active
        )
        
        if (courthouseImages.length > 0) {
          setImages(courthouseImages)
          setUseDefaultPlaceholders(false)
        } else {
          // No images uploaded yet, use placeholders
          setUseDefaultPlaceholders(true)
        }
      } catch (error) {
        console.error('Error fetching images:', error)
        // Fallback to placeholders on error
        setUseDefaultPlaceholders(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  // Image rotation
  useEffect(() => {
    const imageCount = useDefaultPlaceholders ? defaultImages.length : images.length
    if (imageCount === 0) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageCount)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [images.length, useDefaultPlaceholders])

  if (loading) {
    return (
      <div className="relative h-80 rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="animate-pulse text-white text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Loading images...</p>
        </div>
      </div>
    )
  }

  // Use placeholders if no images uploaded
  if (useDefaultPlaceholders) {
    const currentDefault = defaultImages[currentImageIndex]
    return (
      <div className="relative h-80 rounded-lg overflow-hidden shadow-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentDefault.color} flex items-center justify-center transition-all duration-1000`}>
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{currentDefault.original_name}</h3>
            <p className="text-blue-100">{currentDefault.location}</p>
          </div>
        </div>
        
        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {defaultImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white bg-opacity-80' 
                  : 'bg-white bg-opacity-40 hover:bg-opacity-60'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Display uploaded images
  const currentImage = images[currentImageIndex]
  if (!currentImage) return null

  return (
    <div className="relative h-80 rounded-lg overflow-hidden shadow-2xl">
      <Image
        src={currentImage.file_path}
        alt={currentImage.alt_text || currentImage.original_name}
        fill
        className="object-cover transition-opacity duration-1000"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        priority={currentImageIndex === 0}
      />
      
      {/* Overlay with semi-transparent gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      
      {/* Image caption */}
      <div className="absolute bottom-12 left-0 right-0 text-center text-white">
        <h3 className="text-xl font-semibold mb-1 drop-shadow-lg">
          {currentImage.alt_text || currentImage.original_name}
        </h3>
      </div>
      
      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={images[index].id}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              index === currentImageIndex 
                ? 'bg-white bg-opacity-80' 
                : 'bg-white bg-opacity-40 hover:bg-opacity-60'
            }`}
            aria-label={`View image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}




