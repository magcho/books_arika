/**
 * Locations API integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { handleTestRequest } from '../helpers/app'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'

describe('GET /api/locations', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should list all locations for a user', async () => {
    // Create locations first
    const createRequest1 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    await handleTestRequest(createRequest1, db)

    const createRequest2 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: 'Kindle',
        type: 'Digital',
      }),
    })
    await handleTestRequest(createRequest2, db)

    // List locations (FR-011: default location "本棚" is also auto-created)
    const request = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.locations).toBeDefined()
    // Should have 3 locations: default "本棚" + "自宅本棚" + "Kindle"
    expect(data.locations.length).toBe(3)
    expect(data.locations.map((l: { name: string }) => l.name)).toContain('本棚')
    expect(data.locations.map((l: { name: string }) => l.name)).toContain('自宅本棚')
    expect(data.locations.map((l: { name: string }) => l.name)).toContain('Kindle')
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should automatically create default location "本棚" when user has no locations (FR-011)', async () => {
    const request = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.locations).toBeDefined()
    expect(data.locations.length).toBe(1)
    expect(data.locations[0].name).toBe('本棚')
    expect(data.locations[0].type).toBe('Physical')
    expect(data.locations[0].user_id).toBe('default-user')
  })

  it('should not create duplicate default location if it already exists (FR-011 idempotency)', async () => {
    // First call - creates default location
    const request1 = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })
    const response1 = await handleTestRequest(request1, db)
    expect(response1.status).toBe(200)
    const data1 = await response1.json()
    expect(data1.locations.length).toBe(1)
    const defaultLocationId = data1.locations[0].id

    // Second call - should return existing default location, not create duplicate
    const request2 = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })
    const response2 = await handleTestRequest(request2, db)
    expect(response2.status).toBe(200)
    const data2 = await response2.json()
    expect(data2.locations.length).toBe(1)
    expect(data2.locations[0].id).toBe(defaultLocationId)
    expect(data2.locations[0].name).toBe('本棚')
  })
})

describe('POST /api/locations', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should create a location successfully', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
    const location = await response.json()
    expect(location.name).toBe('自宅本棚')
    expect(location.type).toBe('Physical')
    expect(location.user_id).toBe('default-user')
    expect(location.id).toBeDefined()
  })

  it('should create a digital location', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: 'Kindle',
        type: 'Digital',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
    const location = await response.json()
    expect(location.type).toBe('Digital')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        // name is missing
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 400 when type is invalid', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: 'Test Location',
        type: 'Invalid',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 409 when duplicate location name is created', async () => {
    // Create first location
    const request1 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    await handleTestRequest(request1, db)

    // Try to create duplicate
    const request2 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })

    const response = await handleTestRequest(request2, db)
    expect(response.status).toBe(409)
  })
})

describe('GET /api/locations/:location_id', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should get location by ID', async () => {
    // Create location first
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Get location
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const location = await response.json()
    expect(location.id).toBe(created.id)
    expect(location.name).toBe('自宅本棚')
  })

  it('should return 403 when accessing another user\'s location', async () => {
    // Create user first
    await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()

    // Create location for other-user
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'other-user',
        name: 'Other User Location',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Try to access with different user
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(403)
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/locations/1', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 404 when location not found', async () => {
    // Use a very large location ID that definitely doesn't exist
    const request = new Request('http://localhost/api/locations/999999?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    // Location doesn't exist, so should return 404 (not 403)
    expect(response.status).toBe(404)
  })

  it('should return 400 when location_id is not a number', async () => {
    const request = new Request('http://localhost/api/locations/invalid?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/locations/:location_id', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should update location name', async () => {
    // Create location first
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Update location
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '書斎本棚',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const location = await response.json()
    expect(location.name).toBe('書斎本棚')
    expect(location.type).toBe('Physical') // Type should remain unchanged
  })

  it('should return 403 when updating another user\'s location', async () => {
    // Create user first
    await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()

    // Create location for other-user
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'other-user',
        name: 'Other User Location',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Try to update with different user
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacked Name',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(403)
  })

  it('should update location type', async () => {
    // Create location first
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Update location
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Digital',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const location = await response.json()
    expect(location.type).toBe('Digital')
    expect(location.name).toBe('自宅本棚') // Name should remain unchanged
  })

  it('should update both name and type', async () => {
    // Create location first
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Update location
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kindle',
        type: 'Digital',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const location = await response.json()
    expect(location.name).toBe('Kindle')
    expect(location.type).toBe('Digital')
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/locations/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Name',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 404 when location not found', async () => {
    const request = new Request('http://localhost/api/locations/999?user_id=default-user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Name',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })

  it('should return 409 when updating to duplicate name', async () => {
    // Create two locations
    const createRequest1 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse1 = await handleTestRequest(createRequest1, db)
    const location1 = await createResponse1.json()

    const createRequest2 = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: 'Kindle',
        type: 'Digital',
      }),
    })
    const createResponse2 = await handleTestRequest(createRequest2, db)
    const location2 = await createResponse2.json()

    // Try to update location2 to have the same name as location1
    const request = new Request(`http://localhost/api/locations/${location2.id}?user_id=default-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '自宅本棚',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(409)
  })
})

describe('DELETE /api/locations/:location_id', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should delete location successfully', async () => {
    // Create location first
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Delete location
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(204)

    // Verify location is deleted
    const getRequest = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'GET',
    })
    const getResponse = await handleTestRequest(getRequest, db)
    expect(getResponse.status).toBe(404)
  })

  it('should return 403 when deleting another user\'s location', async () => {
    // Create user first
    await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()

    // Create location for other-user
    const createRequest = new Request('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'other-user',
        name: 'Other User Location',
        type: 'Physical',
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Try to delete with different user
    const request = new Request(`http://localhost/api/locations/${created.id}?user_id=default-user`, {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(403)
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/locations/1', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 404 when location not found', async () => {
    const request = new Request('http://localhost/api/locations/999?user_id=default-user', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })

  it('should return 400 when location_id is not a number', async () => {
    const request = new Request('http://localhost/api/locations/invalid?user_id=default-user', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should cascade delete ownerships when location is deleted', async () => {
    // Setup: Create book, location, and ownership
    const { BookService } = await import('../../src/services/book_service')
    const { OwnershipService } = await import('../../src/services/ownership_service')
    const { LocationService } = await import('../../src/services/location_service')
    const { createMockBookInput } = await import('../fixtures/books')
    const { createMockLocationInput } = await import('../fixtures/locations')

    const bookService = new BookService(db)
    const locationService = new LocationService(db)
    const ownershipService = new OwnershipService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create ownership
    const ownership = await ownershipService.create({
      user_id: 'default-user',
      isbn: book.isbn,
      location_id: location.id,
    })

    // Verify ownership exists
    const ownershipsBefore = await ownershipService.findByUserId('default-user')
    expect(ownershipsBefore.length).toBe(1)

    // Delete location
    const request = new Request(`http://localhost/api/locations/${location.id}?user_id=default-user`, {
      method: 'DELETE',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(204)

    // Verify ownership is cascade deleted
    const ownershipsAfter = await ownershipService.findByUserId('default-user')
    expect(ownershipsAfter.length).toBe(0)
  })
})

