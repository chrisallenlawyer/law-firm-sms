'use client'

import { useState, useEffect } from 'react'

const courthouseImages = [
  {
    name: 'Fayette County Courthouse',
    location: 'Fayette, Alabama',
    color: 'from-blue-600 to-blue-800'
  },
  {
    name: 'Lamar County Courthouse', 
    location: 'Vernon, Alabama',
    color: 'from-green-600 to-green-800'
  },
  {
    name: 'Pickens County Courthouse',
    location: 'Carrollton, Alabama', 
    color: 'from-purple-600 to-purple-800'
  }
]

export default function RotatingCourthouseImages() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % courthouseImages.length
      )
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const currentCourthouse = courthouseImages[currentImageIndex]

  return (
    <div className="relative h-80 rounded-lg overflow-hidden shadow-2xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${currentCourthouse.color} flex items-center justify-center transition-all duration-1000`}>
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">{currentCourthouse.name}</h3>
          <p className="text-blue-100">{currentCourthouse.location}</p>
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {courthouseImages.map((_, index) => (
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




