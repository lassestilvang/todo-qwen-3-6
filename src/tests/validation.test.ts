import { describe, it, expect } from 'bun:test'
import {
  createTaskSchema,
  updateTaskSchema,
  createListSchema,
  updateListSchema,
  createLabelSchema,
  updateLabelSchema,
} from '@/lib/validation'

describe('Task Validation', () => {
  describe('createTaskSchema', () => {
    it('should validate a valid task', () => {
      const result = createTaskSchema.safeParse({
        name: 'Test Task',
        description: 'Test description',
        priority: 'high',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Task')
        expect(result.data.priority).toBe('high')
      }
    })

    it('should reject empty name', () => {
      const result = createTaskSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name over 500 characters', () => {
      const result = createTaskSchema.safeParse({ name: 'a'.repeat(501) })
      expect(result.success).toBe(false)
    })

    it('should default priority to none', () => {
      const result = createTaskSchema.safeParse({ name: 'Task' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('none')
      }
    })

    it('should reject invalid priority', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', priority: 'critical' })
      expect(result.success).toBe(false)
    })

    it('should validate estimate format', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', estimate: '01:30' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid estimate format', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', estimate: '25:00' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid estimate format - letters', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', estimate: '1h30m' })
      expect(result.success).toBe(false)
    })

    it('should validate actual time format', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', actualTime: '02:00' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid actual time format', () => {
      const result = createTaskSchema.safeParse({ name: 'Task', actualTime: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should accept valid recurring rule', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        recurringRule: { pattern: 'daily' },
      })
      expect(result.success).toBe(true)
    })

    it('should accept all recurring patterns', () => {
      const patterns = ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom']
      for (const pattern of patterns) {
        const result = createTaskSchema.safeParse({
          name: 'Task',
          recurringRule: { pattern },
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid recurring pattern', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        recurringRule: { pattern: 'biweekly' },
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid labels array', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        labels: ['550e8400-e29b-41d4-a716-446655440000'],
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid subtasks', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        subTasks: [
          { name: 'Subtask 1', completed: false, order: 0 },
          { name: 'Subtask 2', completed: true, order: 1 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject subtask with empty name', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        subTasks: [{ name: '', completed: false, order: 0 }],
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid reminders', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        reminders: [
          { type: 'notification', time: new Date().toISOString() },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid reminder type', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        reminders: [{ type: 'sms', time: new Date().toISOString() }],
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid attachments', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        attachments: [
          { name: 'file.pdf', url: 'https://example.com/file.pdf', size: 1024, mimeType: 'application/pdf' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid attachment URL', () => {
      const result = createTaskSchema.safeParse({
        name: 'Task',
        attachments: [{ name: 'file.pdf', url: 'not-a-url', size: 1024, mimeType: 'application/pdf' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateTaskSchema', () => {
    it('should allow partial updates', () => {
      const result = updateTaskSchema.safeParse({ name: 'Updated' })
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateTaskSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate priority when provided', () => {
      const result = updateTaskSchema.safeParse({ priority: 'invalid' })
      expect(result.success).toBe(false)
    })
  })
})

describe('List Validation', () => {
  describe('createListSchema', () => {
    it('should validate a valid list', () => {
      const result = createListSchema.safeParse({ name: 'Work' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('#6366f1')
        expect(result.data.emoji).toBe('📋')
      }
    })

    it('should reject empty name', () => {
      const result = createListSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 characters', () => {
      const result = createListSchema.safeParse({ name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('should validate color format', () => {
      const result = createListSchema.safeParse({ name: 'List', color: '#ff0000' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid color format', () => {
      const result = createListSchema.safeParse({ name: 'List', color: 'red' })
      expect(result.success).toBe(false)
    })

    it('should accept single emoji', () => {
      const result = createListSchema.safeParse({ name: 'List', emoji: '💼' })
      expect(result.success).toBe(true)
    })

    it('should reject emoji over 2 characters', () => {
      const result = createListSchema.safeParse({ name: 'List', emoji: 'abc' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateListSchema', () => {
    it('should allow partial updates', () => {
      const result = updateListSchema.safeParse({ name: 'Updated' })
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateListSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})

describe('Label Validation', () => {
  describe('createLabelSchema', () => {
    it('should validate a valid label', () => {
      const result = createLabelSchema.safeParse({ name: 'Urgent' })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createLabelSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name over 50 characters', () => {
      const result = createLabelSchema.safeParse({ name: 'a'.repeat(51) })
      expect(result.success).toBe(false)
    })

    it('should validate color format', () => {
      const result = createLabelSchema.safeParse({ name: 'Label', color: '#00ff00' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid color', () => {
      const result = createLabelSchema.safeParse({ name: 'Label', color: 'not-a-color' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateLabelSchema', () => {
    it('should allow partial updates', () => {
      const result = updateLabelSchema.safeParse({ name: 'Updated' })
      expect(result.success).toBe(true)
    })
  })
})
