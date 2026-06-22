/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
    const result = db.pragma('foreign_keys', { simple: true }) as any
    expect(result).toBe(1)
  })

  it('should use WAL journal mode', () => {
    const db = getDb()
    const result = db.pragma('journal_mode', { simple: true }) as any
    expect(result).toBe('wal')
  })

  it('should self-heal duplicate lists and re-associate tasks', () => {
    const db = getDb()
    
    // Insert duplicate lists
    db.prepare("INSERT INTO lists (id, name, color, emoji, is_default) VALUES ('list-a1', 'Duplicate List', '#111', '📋', 0)").run()
    db.prepare("INSERT INTO lists (id, name, color, emoji, is_default) VALUES ('list-a2', 'Duplicate List', '#222', '📋', 0)").run()
    
    // Insert tasks linked to both
    db.prepare("INSERT INTO tasks (id, name, list_id) VALUES ('task-1', 'Task in list A1', 'list-a1')").run()
    db.prepare("INSERT INTO tasks (id, name, list_id) VALUES ('task-2', 'Task in list A2', 'list-a2')").run()

    // Close and reopen database to trigger initialization schema & deduplication
    closeDb()
    const dbReopened = getDb()

    // Verify lists are merged
    const lists = dbReopened.prepare("SELECT * FROM lists WHERE name = 'Duplicate List'").all() as any[]
    expect(lists.length).toBe(1)
    const primaryId = lists[0].id

    // Verify all tasks now point to the remaining list
    const tasks = dbReopened.prepare("SELECT * FROM tasks WHERE id IN ('task-1', 'task-2')").all() as any[]
    expect(tasks[0].list_id).toBe(primaryId)
    expect(tasks[1].list_id).toBe(primaryId)
  })

  it('should self-heal duplicate labels and re-associate tasks', () => {
    const db = getDb()

    // Insert duplicate labels
    db.prepare("INSERT INTO labels (id, name) VALUES ('lbl-1', 'Duplicate Label')").run()
    db.prepare("INSERT INTO labels (id, name) VALUES ('lbl-2', 'Duplicate Label')").run()

    // Create a task
    db.prepare("INSERT INTO tasks (id, name) VALUES ('task-lbl-test', 'Task for labels')").run()

    // Link task to both duplicate labels (e.g. duplicate associations)
    db.prepare("INSERT INTO task_labels (task_id, label_id) VALUES ('task-lbl-test', 'lbl-1')").run()
    db.prepare("INSERT INTO task_labels (task_id, label_id) VALUES ('task-lbl-test', 'lbl-2')").run()

    // Close and reopen
    closeDb()
    const dbReopened = getDb()

    // Verify labels are merged
    const labels = dbReopened.prepare("SELECT * FROM labels WHERE name = 'Duplicate Label'").all() as any[]
    expect(labels.length).toBe(1)

    // Verify task label relationships are cleaned up (only 1 remains)
    const links = dbReopened.prepare("SELECT * FROM task_labels WHERE task_id = 'task-lbl-test'").all() as any[]
    expect(links.length).toBe(1)
    expect(links[0].label_id).toBe(labels[0].id)
  })
})
