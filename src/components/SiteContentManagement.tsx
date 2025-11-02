'use client'

import { useState, useEffect } from 'react'

interface SiteContent {
  id: string
  content_key: string
  content_value: string
  content_type: 'text' | 'html' | 'json'
  section: string
  description: string | null
  is_active: boolean
  updated_at: string
}

export default function SiteContentManagement() {
  const [content, setContent] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null)
  const [editValue, setEditValue] = useState('')

  // Fetch content on mount
  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-content')
      if (!response.ok) throw new Error('Failed to fetch content')
      const result = await response.json()
      setContent(result.data || [])
    } catch (err) {
      console.error('Error fetching content:', err)
      setError('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (contentItem: SiteContent) => {
    setEditingContent(contentItem)
    setEditValue(contentItem.content_value)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingContent(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingContent) return

    try {
      const response = await fetch(`/api/site-content/${editingContent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_value: editValue }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      setSuccessMessage('Content updated successfully')
      setEditingContent(null)
      setEditValue('')
      fetchContent()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update content')
    }
  }

  const handleToggleActive = async (contentItem: SiteContent) => {
    try {
      const response = await fetch(`/api/site-content/${contentItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !contentItem.is_active }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Update failed')
      }

      setSuccessMessage(`Content ${!contentItem.is_active ? 'activated' : 'deactivated'}`)
      fetchContent()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update content')
    }
  }

  // Group content by section
  const contentBySection = content.reduce((acc: Record<string, SiteContent[]>, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {})

  // Auto-dismiss messages
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading content...</p>
      </div>
    )
  }

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

      {/* Edit Modal */}
      {editingContent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Edit Content
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingContent.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <p className="text-xs text-gray-500 mb-2">{editingContent.description}</p>
                
                {editingContent.content_type === 'html' ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
                    placeholder="Enter HTML content..."
                  />
                ) : (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter content..."
                  />
                )}
                
                {editingContent.content_type === 'html' && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                    <div 
                      className="bg-gray-50 p-3 rounded-md border border-gray-200"
                      dangerouslySetInnerHTML={{ __html: editValue }}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {Object.entries(contentBySection).map(([section, contents]) => (
        <div key={section} className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 capitalize">
              {section.replace(/_/g, ' ')} Section
            </h3>
            <div className="space-y-4">
              {contents.map((contentItem) => (
                <div key={contentItem.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {contentItem.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      {contentItem.description && (
                        <p className="text-xs text-gray-500 mt-1">{contentItem.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contentItem.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contentItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {contentItem.content_type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {contentItem.content_type === 'html' ? (
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div 
                          className="text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: contentItem.content_value }}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{contentItem.content_value}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Last updated: {new Date(contentItem.updated_at).toLocaleDateString()} at {new Date(contentItem.updated_at).toLocaleTimeString()}
                    </span>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleEdit(contentItem)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleActive(contentItem)}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        {contentItem.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {content.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding some content to your site.</p>
        </div>
      )}

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
                <li>• Preview changes before saving</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Content Types</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Text:</strong> Plain text content</li>
                <li>• <strong>HTML:</strong> Formatted content with HTML tags (use &lt;br /&gt; for line breaks)</li>
                <li>• <strong>JSON:</strong> Structured data for complex content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

