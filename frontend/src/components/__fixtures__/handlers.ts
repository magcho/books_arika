/// <reference types="vite/client" />
import { http, HttpResponse } from 'msw'
import { mockBooks } from './books'
import { mockLocations } from './locations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

export const handlers = [
  // Book search
  http.get(`${API_URL}/search/books`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const maxResults = parseInt(url.searchParams.get('maxResults') || '10', 10)
    
    // Filter mock books based on query
    const filteredBooks = query
      ? mockBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author?.toLowerCase().includes(query.toLowerCase())
        )
      : mockBooks
    
    return HttpResponse.json({
      items: filteredBooks.slice(0, maxResults),
    })
  }),

  // Barcode search
  http.post(`${API_URL}/search/barcode`, async ({ request }) => {
    const body = await request.json() as { isbn: string }
    const foundBook = mockBooks.find((book) => book.isbn === body.isbn)
    
    if (foundBook) {
      return HttpResponse.json(foundBook)
    }
    
    return HttpResponse.json(
      { message: '書籍が見つかりませんでした' },
      { status: 404 }
    )
  }),

  // Create book
  http.post(`${API_URL}/books`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // List locations
  http.get(`${API_URL}/locations`, () => {
    return HttpResponse.json({
      locations: mockLocations,
    })
  }),

  // Create location
  http.post(`${API_URL}/locations`, async ({ request }) => {
    const body = await request.json() as { user_id: string; name: string; type: 'Physical' | 'Digital' }
    return HttpResponse.json({
      id: mockLocations.length + 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Update location
  http.put(`${API_URL}/locations/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const location = mockLocations.find((loc) => loc.id === Number(params.id))
    if (!location) {
      return HttpResponse.json({ message: 'Location not found' }, { status: 404 })
    }
    return HttpResponse.json({
      ...location,
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  // Delete location
  http.delete(`${API_URL}/locations/:id`, () => {
    return HttpResponse.json(null, { status: 204 })
  }),
]

