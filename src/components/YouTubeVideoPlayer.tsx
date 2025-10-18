'use client'

import { useState, useEffect } from 'react'

interface YouTubeVideo {
  id: string
  title: string
  description: string | null
  video_type: 'video' | 'playlist'
  youtube_id: string
  is_active: boolean
  display_order: number
}

export default function YouTubeVideoPlayer() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/youtube-videos?active=true')
      if (!response.ok) throw new Error('Failed to fetch videos')
      const data = await response.json()
      setVideos(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (videos.length === 0) {
    return null // Don't show the section if there are no active videos
  }

  const currentVideo = videos[currentIndex]

  const getEmbedUrl = (video: YouTubeVideo): string => {
    if (video.video_type === 'playlist') {
      return `https://www.youtube.com/embed/videoseries?list=${video.youtube_id}`
    }
    return `https://www.youtube.com/embed/${video.youtube_id}`
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {videos.length > 1 ? 'Featured Videos' : 'Featured Video'}
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {currentVideo.description || 'Watch our videos to learn more about our services'}
          </p>
        </div>

        {/* Video Player */}
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
            <iframe
              src={getEmbedUrl(currentVideo)}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          {/* Video Info */}
          <div className="mt-4 text-center">
            <h4 className="text-xl font-semibold text-gray-900">{currentVideo.title}</h4>
            <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
              currentVideo.video_type === 'video' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {currentVideo.video_type === 'video' ? 'Video' : 'Playlist'}
            </span>
          </div>

          {/* Navigation (if multiple videos) */}
          {videos.length > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1))}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                aria-label="Previous video"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Video Thumbnails/Indicators */}
              <div className="flex space-x-2">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-blue-600 w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to video ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1))}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                aria-label="Next video"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Video List (if multiple videos) */}
          {videos.length > 1 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    index === currentIndex
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      video.video_type === 'video' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {video.video_type === 'video' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        index === currentIndex ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {video.video_type === 'video' ? 'Single Video' : 'Playlist'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

