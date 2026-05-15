import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import Database from 'better-sqlite3'
import { getDb, closeDb } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.db')

describe('Database', () => {
  beforeEach(() => {
    closeDb()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    process.env.DB_PATH = TEST_DB_PATH
  })

  afterEach(() => {
    closeDb()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('should create database file', () => {
    const db = getDb()
    expect(db).toBeDefined()
  })

  it('should create lists table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('lists')
  })

  it('should create tasks table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('tasks')
  })

  it('should create labels table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('labels')
  })

  it('should create subtasks table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('subtasks')
  })

  it('should create task_changes table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('task_changes')
  })

  it('should create reminders table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('reminders')
  })

  it('should create attachments table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('attachments')
  })

  it('should create task_labels table', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)
    expect(tableNames).toContain('task_labels')
  })

  it('should create inbox list by default', () => {
    const db = getDb()
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any
    expect(inbox).toBeDefined()
    expect(inbox.name).toBe('Inbox')
    expect(inbox.emoji).toBe('📥')
  })

  it('should enable foreign keys', () => {
    const db = getDb()
    const result = db.pragma('foreign_keys') as any
    expect(result).toBe(1)
  })

  it('should use WAL journal mode', () => {
    const db = getDb()
    const result = db.pragma('journal_mode') as any
    expect(result).toBe('wal')
  })
})
