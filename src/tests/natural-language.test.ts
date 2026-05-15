import { describe, it, expect } from 'bun:test'
import { parseNaturalLanguage, formatTimeDifference } from '@/lib/natural-language'
import { addDays, startOfDay } from 'date-fns'

describe('Natural Language Parser', () => {
  describe('basic task parsing', () => {
    it('should parse a simple task name', () => {
      const result = parseNaturalLanguage('Buy groceries')
      expect(result.name).toBe('Buy groceries')
      expect(result.date).toBeNull()
      expect(result.time).toBeNull()
      expect(result.priority).toBe('none')
    })

    it('should handle empty input', () => {
      const result = parseNaturalLanguage('')
      expect(result.name).toBe('Untitled Task')
    })

    it('should handle whitespace-only input', () => {
      const result = parseNaturalLanguage('   ')
      expect(result.name).toBe('Untitled Task')
    })
  })

  describe('date parsing', () => {
    it('should parse "today"', () => {
      const result = parseNaturalLanguage('Meeting today')
      expect(result.name).toBe('Meeting')
      expect(result.date).toBeDefined()
      expect(result.date?.toDateString()).toBe(new Date().toDateString())
    })

    it('should parse "tomorrow"', () => {
      const result = parseNaturalLanguage('Call mom tomorrow')
      expect(result.name).toBe('Call mom')
      expect(result.date).toBeDefined()
      const tomorrow = addDays(new Date(), 1)
      expect(result.date?.toDateString()).toBe(tomorrow.toDateString())
    })

    it('should parse day names', () => {
      const result = parseNaturalLanguage('Lunch on Monday')
      expect(result.name).toBe('Lunch on')
      expect(result.date).toBeDefined()
    })

    it('should parse "next Monday"', () => {
      const result = parseNaturalLanguage('Review next Monday')
      expect(result.name).toBe('Review')
      expect(result.date).toBeDefined()
    })
  })

  describe('time parsing', () => {
    it('should parse 24-hour time', () => {
      const result = parseNaturalLanguage('Meeting at 14:30')
      expect(result.name).toBe('Meeting')
      expect(result.time).toBe('14:30')
    })

    it('should parse 12-hour time with AM', () => {
      const result = parseNaturalLanguage('Breakfast at 8:00am')
      expect(result.name).toBe('Breakfast')
      expect(result.time).toBe('08:00')
    })

    it('should parse 12-hour time with PM', () => {
      const result = parseNaturalLanguage('Lunch at 1:30pm')
      expect(result.name).toBe('Lunch')
      expect(result.time).toBe('13:30')
    })

    it('should parse 12 PM correctly', () => {
      const result = parseNaturalLanguage('Noon at 12pm')
      expect(result.time).toBe('12:00')
    })

    it('should parse 12 AM correctly', () => {
      const result = parseNaturalLanguage('Midnight at 12am')
      expect(result.time).toBe('00:00')
    })

    it('should parse hour-only time', () => {
      const result = parseNaturalLanguage('Meeting at 3pm')
      expect(result.time).toBe('15:00')
    })
  })

  describe('priority parsing', () => {
    it('should parse "high" priority', () => {
      const result = parseNaturalLanguage('Urgent task high')
      expect(result.name).toBe('Urgent task')
      expect(result.priority).toBe('high')
    })

    it('should parse "urgent" as high priority', () => {
      const result = parseNaturalLanguage('Fix bug urgent')
      expect(result.priority).toBe('high')
    })

    it('should parse "important" as high priority', () => {
      const result = parseNaturalLanguage('Important meeting')
      expect(result.priority).toBe('high')
    })

    it('should parse "medium" priority', () => {
      const result = parseNaturalLanguage('Regular task medium')
      expect(result.priority).toBe('medium')
    })

    it('should parse "low" priority', () => {
      const result = parseNaturalLanguage('Optional task low')
      expect(result.priority).toBe('low')
    })

    it('should parse shorthand !h', () => {
      const result = parseNaturalLanguage('Task !high')
      expect(result.priority).toBe('high')
    })

    it('should parse shorthand !m', () => {
      const result = parseNaturalLanguage('Task !medium')
      expect(result.priority).toBe('medium')
    })

    it('should parse shorthand !l', () => {
      const result = parseNaturalLanguage('Task !low')
      expect(result.priority).toBe('low')
    })
  })

  describe('combined parsing', () => {
    it('should parse date and time together', () => {
      const result = parseNaturalLanguage('Meeting tomorrow at 10:00')
      expect(result.name).toBe('Meeting')
      expect(result.date).toBeDefined()
      expect(result.time).toBe('10:00')
    })

    it('should parse date, time, and priority', () => {
      const result = parseNaturalLanguage('Important meeting tomorrow at 2pm high')
      expect(result.name).toBe('Important meeting')
      expect(result.date).toBeDefined()
      expect(result.time).toBe('14:00')
      expect(result.priority).toBe('high')
    })

    it('should handle complex natural language', () => {
      const result = parseNaturalLanguage('Lunch with Sarah at 1 PM tomorrow')
      expect(result.name).toBe('Lunch with Sarah')
      expect(result.time).toBe('13:00')
      expect(result.date).toBeDefined()
    })
  })
})

describe('Format Time Difference', () => {
  it('should format today', () => {
    const today = startOfDay(new Date())
    expect(formatTimeDifference(today)).toBe('Today')
  })

  it('should format tomorrow', () => {
    const tomorrow = startOfDay(addDays(new Date(), 1))
    expect(formatTimeDifference(tomorrow)).toBe('Tomorrow')
  })

  it('should format yesterday', () => {
    const yesterday = startOfDay(addDays(new Date(), -1))
    expect(formatTimeDifference(yesterday)).toBe('Yesterday')
  })

  it('should format days in future', () => {
    const future = startOfDay(addDays(new Date(), 5))
    expect(formatTimeDifference(future)).toBe('In 5 days')
  })

  it('should format overdue days', () => {
    const overdue = startOfDay(addDays(new Date(), -5))
    expect(formatTimeDifference(overdue)).toBe('5 days overdue')
  })
})
