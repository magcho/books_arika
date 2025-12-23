/**
 * LocationService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { LocationService } from '../../src/services/location_service'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMockLocationInput } from '../fixtures/locations'
import { BookService } from '../../src/services/book_service'
import { createMockBookInput } from '../fixtures/books'

describe('LocationService', () => {
  let db: D1Database
  let locationService: LocationService

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    locationService = new LocationService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('create', () => {
    it('should create a location', async () => {
      const input = createMockLocationInput({
        name: '自宅本棚',
        type: 'Physical',
      })

      const location = await locationService.create(input)

      expect(location.name).toBe('自宅本棚')
      expect(location.type).toBe('Physical')
      expect(location.user_id).toBe('default-user')
      expect(location.id).toBeDefined()
      expect(location.created_at).toBeDefined()
      expect(location.updated_at).toBeDefined()
    })

    it('should create a digital location', async () => {
      const input = createMockLocationInput({
        name: 'Kindle',
        type: 'Digital',
      })

      const location = await locationService.create(input)

      expect(location.name).toBe('Kindle')
      expect(location.type).toBe('Digital')
    })

    it('should throw error when name is empty', async () => {
      const input = createMockLocationInput({
        name: '',
      })

      await expect(locationService.create(input)).rejects.toThrow('場所名は必須です')
    })

    it('should throw error when name exceeds 100 characters', async () => {
      const input = createMockLocationInput({
        name: 'a'.repeat(101),
      })

      await expect(locationService.create(input)).rejects.toThrow('場所名は100文字以内で入力してください')
    })

    it('should throw error when type is invalid', async () => {
      const input = createMockLocationInput({
        type: 'Invalid' as 'Physical' | 'Digital',
      })

      await expect(locationService.create(input)).rejects.toThrow('場所の形式は "Physical" または "Digital" である必要があります')
    })

    it('should throw error when creating duplicate location name for same user', async () => {
      const input = createMockLocationInput({
        name: '自宅本棚',
      })

      await locationService.create(input)

      await expect(locationService.create(input)).rejects.toThrow('場所 "自宅本棚" は既に登録されています')
    })

    it('should allow same location name for different users', async () => {
      // Create users first
      await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('user1', 'User 1').run()
      await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('user2', 'User 2').run()
      
      const input1 = createMockLocationInput({
        user_id: 'user1',
        name: '自宅本棚',
      })
      const input2 = createMockLocationInput({
        user_id: 'user2',
        name: '自宅本棚',
      })

      const location1 = await locationService.create(input1)
      const location2 = await locationService.create(input2)

      expect(location1.name).toBe('自宅本棚')
      expect(location2.name).toBe('自宅本棚')
      expect(location1.user_id).toBe('user1')
      expect(location2.user_id).toBe('user2')
    })
  })

  describe('findById', () => {
    it('should find location by ID', async () => {
      const input = createMockLocationInput()
      const created = await locationService.create(input)

      const found = await locationService.findById(created.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe(created.name)
    })

    it('should return null when location not found', async () => {
      const found = await locationService.findById(999)

      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all locations for a user', async () => {
      const input1 = createMockLocationInput({ name: '自宅本棚' })
      const input2 = createMockLocationInput({ name: 'Kindle' })

      await locationService.create(input1)
      await locationService.create(input2)

      const locations = await locationService.findByUserId('default-user')

      expect(locations.length).toBe(2)
      expect(locations.map((l) => l.name)).toContain('自宅本棚')
      expect(locations.map((l) => l.name)).toContain('Kindle')
    })

    it('should return empty array when user has no locations', async () => {
      const locations = await locationService.findByUserId('default-user')

      expect(locations).toEqual([])
    })
  })

  describe('update', () => {
    it('should update location name', async () => {
      const created = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

      const updated = await locationService.update(created.id, { name: '書斎本棚' })

      expect(updated.name).toBe('書斎本棚')
      expect(updated.type).toBe(created.type)
      expect(updated.id).toBe(created.id)
    })

    it('should update location type', async () => {
      const created = await locationService.create(createMockLocationInput({ type: 'Physical' }))

      const updated = await locationService.update(created.id, { type: 'Digital' })

      expect(updated.type).toBe('Digital')
      expect(updated.name).toBe(created.name)
    })

    it('should update both name and type', async () => {
      const created = await locationService.create(createMockLocationInput({ name: '自宅本棚', type: 'Physical' }))

      const updated = await locationService.update(created.id, { name: 'Kindle', type: 'Digital' })

      expect(updated.name).toBe('Kindle')
      expect(updated.type).toBe('Digital')
    })

    it('should return existing location when no updates provided', async () => {
      const created = await locationService.create(createMockLocationInput())

      const updated = await locationService.update(created.id, {})

      expect(updated).toEqual(created)
    })

    it('should throw error when location not found', async () => {
      await expect(locationService.update(999, { name: 'New Name' })).rejects.toThrow('場所が見つかりません')
    })

    it('should throw error when updating to duplicate name', async () => {
      await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
      const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle' }))

      await expect(locationService.update(location2.id, { name: '自宅本棚' })).rejects.toThrow(
        '場所 "自宅本棚" は既に登録されています'
      )
    })
  })

  describe('delete', () => {
    it('should delete location', async () => {
      const created = await locationService.create(createMockLocationInput())

      await locationService.delete(created.id)

      const found = await locationService.findById(created.id)
      expect(found).toBeNull()
    })

    it('should throw error when location not found', async () => {
      await expect(locationService.delete(999)).rejects.toThrow('場所が見つかりません')
    })
  })
})

