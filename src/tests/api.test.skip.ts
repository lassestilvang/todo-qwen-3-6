import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'fs'
import path from 'path'
import { closeDb } from '@/lib/db'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-api.db')

describe('API Integration Tests', () => {
  beforeEach(() => {
    closeDb()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  afterEach(() => {
    closeDb()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('should create and retrieve a task via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API Test Task' }),
    })

    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    expect(created.name).toBe('API Test Task')

    const getRes = await fetch(`http://localhost:3000/api/tasks/${created.id}`)
    expect(getRes.status).toBe(200)
    const retrieved = await getRes.json()
    expect(retrieved.name).toBe('API Test Task')
  })

  it('should update a task via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Update Me' }),
    })

    const created = await createRes.json()

    const updateRes = await fetch(`http://localhost:3000/api/tasks/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', priority: 'high' }),
    })

    expect(updateRes.status).toBe(200)
    const updated = await updateRes.json()
    expect(updated.name).toBe('Updated')
    expect(updated.priority).toBe('high')
  })

  it('should delete a task via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Delete Me' }),
    })

    const created = await createRes.json()

    const deleteRes = await fetch(`http://localhost:3000/api/tasks/${created.id}`, {
      method: 'DELETE',
    })

    expect(deleteRes.status).toBe(200)

    const getRes = await fetch(`http://localhost:3000/api/tasks/${created.id}`)
    expect(getRes.status).toBe(404)
  })

  it('should reject invalid task creation', async () => {
    const res = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })

    expect(res.status).toBe(400)
  })

  it('should list all tasks', async () => {
    await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Task 1' }),
    })

    await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Task 2' }),
    })

    const res = await fetch('http://localhost:3000/api/tasks?view=all')
    expect(res.status).toBe(200)
    const tasks = await res.json()
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('should create and retrieve a list via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API List', color: '#ff0000', emoji: '🔥' }),
    })

    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    expect(created.name).toBe('API List')

    const listsRes = await fetch('http://localhost:3000/api/lists')
    const lists = await listsRes.json()
    expect(lists.some((l: any) => l.name === 'API List')).toBe(true)
  })

  it('should create and retrieve a label via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API Label', color: '#00ff00', icon: '⭐' }),
    })

    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    expect(created.name).toBe('API Label')
  })

  it('should search tasks via API', async () => {
    await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Searchable Task' }),
    })

    await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other Task' }),
    })

    const res = await fetch('http://localhost:3000/api/search?q=searchable')
    expect(res.status).toBe(200)
    const results = await res.json()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Searchable Task')
  })

  it('should return 404 for non-existent task', async () => {
    const res = await fetch('http://localhost:3000/api/tasks/non-existent-id')
    expect(res.status).toBe(404)
  })

  it('should log changes when updating via API', async () => {
    const createRes = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Change Log Test' }),
    })

    const created = await createRes.json()

    await fetch(`http://localhost:3000/api/tasks/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Changed Name' }),
    })

    const changesRes = await fetch(`http://localhost:3000/api/tasks/${created.id}/changes`)
    expect(changesRes.status).toBe(200)
    const changes = await changesRes.json()
    expect(changes.length).toBeGreaterThan(0)
  })
})
