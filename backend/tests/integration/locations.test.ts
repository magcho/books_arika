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

    // List locations
    const request = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.locations).toBeDefined()
    expect(data.locations.length).toBe(2)
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

  it('should return empty array when user has no locations', async () => {
    const request = new Request('http://localhost/api/locations?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.locations).toEqual([])
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
    const request = new Request(`http://localhost/api/locations/${created.id}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const location = await response.json()
    expect(location.id).toBe(created.id)
    expect(location.name).toBe('自宅本棚')
  })

  it('should return 404 when location not found', async () => {
    const request = new Request('http://localhost/api/locations/999', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })

  it('should return 400 when location_id is not a number', async () => {
    const request = new Request('http://localhost/api/locations/invalid', {
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
    const request = new Request(`http://localhost/api/locations/${created.id}`, {
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
    const request = new Request(`http://localhost/api/locations/${created.id}`, {
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
    const request = new Request(`http://localhost/api/locations/${created.id}`, {
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

  it('should return 404 when location not found', async () => {
    const request = new Request('http://localhost/api/locations/999', {
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
    const request = new Request(`http://localhost/api/locations/${location2.id}`, {
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
    const request = new Request(`http://localhost/api/locations/${created.id}`, {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(204)

    // Verify location is deleted
    const getRequest = new Request(`http://localhost/api/locations/${created.id}`, {
      method: 'GET',
    })
    const getResponse = await handleTestRequest(getRequest, db)
    expect(getResponse.status).toBe(404)
  })

  it('should return 404 when location not found', async () => {
    const request = new Request('http://localhost/api/locations/999', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })

  it('should return 400 when location_id is not a number', async () => {
    const request = new Request('http://localhost/api/locations/invalid', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })
})

