import { describe, it, expect } from 'bun:test'
import { parseNaturalLanguage, formatTimeDifference, getNextRecurrenceDate } from '@/lib/natural-language'
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

    it('should parse "in 3 days"', () => {
      const result = parseNaturalLanguage('Water plants in 3 days')
      expect(result.name).toBe('Water plants')
      expect(result.date?.toDateString()).toBe(addDays(new Date(), 3).toDateString())
    })

    it('should parse "in 2 weeks"', () => {
      const result = parseNaturalLanguage('Doctor appointment in 2 weeks')
      expect(result.name).toBe('Doctor appointment')
      expect(result.date?.toDateString()).toBe(addDays(new Date(), 14).toDateString())
    })

    it('should parse "next week"', () => {
      const result = parseNaturalLanguage('File taxes next week')
      expect(result.name).toBe('File taxes')
      expect(result.date?.toDateString()).toBe(addDays(new Date(), 7).toDateString())
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

  describe('label and list parsing', () => {
    it('should parse single label', () => {
      const result = parseNaturalLanguage('Buy milk #groceries')
      expect(result.name).toBe('Buy milk')
      expect(result.labels).toEqual(['groceries'])
    })

    it('should parse multiple labels', () => {
      const result = parseNaturalLanguage('Call boss #work #urgent')
      expect(result.name).toBe('Call boss')
      expect(result.labels).toEqual(['work', 'urgent'])
    })

    it('should parse list name', () => {
      const result = parseNaturalLanguage('Meeting @work')
      expect(result.name).toBe('Meeting')
      expect(result.listName).toBe('work')
    })

    it('should parse label and list together', () => {
      const result = parseNaturalLanguage('Buy bread @shopping #food')
      expect(result.name).toBe('Buy bread')
      expect(result.listName).toBe('shopping')
      expect(result.labels).toEqual(['food'])
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

describe('getNextRecurrenceDate', () => {
  it('should calculate next daily recurrence', () => {
    const from = new Date(2026, 5, 23, 12, 0, 0)
    const result = getNextRecurrenceDate({ pattern: 'daily', interval: 2 }, from)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(25)
  })

  it('should calculate next weekday recurrence from Friday to Monday', () => {
    const from = new Date(2026, 5, 19, 12, 0, 0) // Friday
    const result = getNextRecurrenceDate({ pattern: 'weekday' }, from)
    expect(result.getDay()).toBe(1) // Monday
    expect(result.getDate()).toBe(22)
  })

  it('should calculate next weekly recurrence with specific days of week', () => {
    const from = new Date(2026, 5, 23, 12, 0, 0) // Tuesday (day index 2)
    // next Thursday (day index 4)
    const result = getNextRecurrenceDate({ pattern: 'weekly', daysOfWeek: [4] }, from)
    expect(result.getDay()).toBe(4) // Thursday
    expect(result.getDate()).toBe(25)
  })

  it('should calculate next weekly recurrence for next week if all days of week passed', () => {
    const from = new Date(2026, 5, 24, 12, 0, 0) // Wednesday (day index 3)
    // Monday (day index 1)
    const result = getNextRecurrenceDate({ pattern: 'weekly', daysOfWeek: [1] }, from)
    expect(result.getDay()).toBe(1) // Monday
    expect(result.getDate()).toBe(29)
  })

  it('should calculate next weekly recurrence interval weeks if daysOfWeek is empty', () => {
    const from = new Date(2026, 5, 23, 12, 0, 0)
    const result = getNextRecurrenceDate({ pattern: 'weekly', interval: 2 }, from)
    expect(result.getDate()).toBe(7) // 14 days later is July 7
    expect(result.getMonth()).toBe(6) // July
  })

  it('should calculate next monthly recurrence', () => {
    const from = new Date(2026, 5, 23, 12, 0, 0)
    const result = getNextRecurrenceDate({ pattern: 'monthly', interval: 1 }, from)
    expect(result.getMonth()).toBe(6) // July
    expect(result.getDate()).toBe(23)
  })

  it('should calculate next yearly recurrence', () => {
    const from = new Date(2026, 5, 23, 12, 0, 0)
    const result = getNextRecurrenceDate({ pattern: 'yearly', interval: 1 }, from)
    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(23)
  })
})
