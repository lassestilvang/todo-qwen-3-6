import { addDays, startOfDay, isValid, addWeeks, addMonths, addYears } from 'date-fns'
import { RecurringRule, RecurringPattern } from './types'

interface ParsedTask {
  name: string
  date: Date | null
  time: string | null
  priority: 'high' | 'medium' | 'low' | 'none'
  labels: string[]
  listName: string | null
  recurringRule: RecurringRule | null
}

export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

const RELATIVE_DATES: Record<string, (date: Date) => Date> = {
  'today': (d) => d,
  'tomorrow': (d) => addDays(d, 1),
  'yesterday': (d) => addDays(d, -1),
}

const PRIORITY_KEYWORDS: Record<string, 'high' | 'medium' | 'low'> = {
  'high': 'high',
  'urgent': 'high',
  'important': 'high',
  'medium': 'medium',
  'normal': 'medium',
  'low': 'low',
}

export function parseNaturalLanguage(input: string): ParsedTask {
  let remaining = input.trim()
  let date: Date | null = null
  let time: string | null = null
  let priority: 'high' | 'medium' | 'low' | 'none' = 'none'
  let labels: string[] = []
  let listName: string | null = null
  let recurringRule: RecurringRule | null = null

  const now = new Date()

  remaining = extractLabels(remaining, (l) => { labels = l })
  remaining = extractList(remaining, (l) => { listName = l })
  remaining = extractRecurring(remaining, (r) => { recurringRule = r })
  remaining = extractTime(remaining, (t) => { time = t })
  remaining = extractDate(remaining, now, (d) => { date = d })
  remaining = extractPriority(remaining, (p) => { priority = p })

  remaining = remaining.replace(/\s+/g, ' ').trim()

  if (remaining.startsWith(',')) {
    remaining = remaining.slice(1).trim()
  }

  return {
    name: remaining || 'Untitled Task',
    date,
    time,
    priority,
    labels,
    listName,
    recurringRule,
  }
}

function extractRecurring(input: string, callback: (rule: RecurringRule) => void): string {
  const lowerInput = input.toLowerCase()
  
  const patterns: { regex: RegExp; pattern: RecurringPattern; daysOfWeek?: number[] }[] = [
    { regex: /\bevery\s+day\b/i, pattern: 'daily' },
    { regex: /\bdaily\b/i, pattern: 'daily' },
    { regex: /\bevery\s+week\b/i, pattern: 'weekly' },
    { regex: /\bweekly\b/i, pattern: 'weekly' },
    { regex: /\bevery\s+weekday\b/i, pattern: 'weekday' },
    { regex: /\bevery\s+month\b/i, pattern: 'monthly' },
    { regex: /\bmonthly\b/i, pattern: 'monthly' },
    { regex: /\bevery\s+year\b/i, pattern: 'yearly' },
    { regex: /\byearly\b/i, pattern: 'yearly' },
  ]

  // Check for specific days: "every monday"
  DAYS.forEach((day, index) => {
    patterns.push({
      regex: new RegExp(`\\bevery\\s+${day}\\b`, 'i'),
      pattern: 'weekly',
      daysOfWeek: [index]
    })
  })

  for (const p of patterns) {
    const match = input.match(p.regex)
    if (match) {
      callback({
        pattern: p.pattern,
        daysOfWeek: p.daysOfWeek,
      })
      return input.replace(match[0], '').trim()
    }
  }

  return input
}

function extractLabels(input: string, callback: (labels: string[]) => void): string {
  const labelRegex = /#(\w+)/g
  const matches = [...input.matchAll(labelRegex)]
  if (matches.length > 0) {
    callback(matches.map(m => m[1]))
    return input.replace(labelRegex, '').trim()
  }
  return input
}

function extractList(input: string, callback: (list: string) => void): string {
  const listRegex = /@(\w+)/
  const match = input.match(listRegex)
  if (match) {
    callback(match[1])
    return input.replace(listRegex, '').trim()
  }
  return input
}

function extractTime(input: string, callback: (time: string) => void): string {
  const timePatterns = [
    { regex: /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?/i, hasMinutes: true },
    { regex: /(?:at\s+)?(\d{1,2})\s*(am|pm)/i, hasMinutes: false },
  ]

  for (const pattern of timePatterns) {
    const match = input.match(pattern.regex)
    if (match) {
      let hours = parseInt(match[1], 10)
      const minutes = pattern.hasMinutes ? parseInt(match[2], 10) : 0
      const period = pattern.hasMinutes ? match[3]?.toLowerCase() : match[2]?.toLowerCase()

      if (period) {
        if (period === 'pm' && hours !== 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0
      }

      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      callback(timeStr)
      return input.replace(match[0], '').trim()
    }
  }

  return input
}

function extractDate(input: string, now: Date, callback: (date: Date) => void): string {
  const lowerInput = input.toLowerCase()

  for (const [keyword, fn] of Object.entries(RELATIVE_DATES)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(lowerInput)) {
      callback(startOfDay(fn(now)))
      return input.replace(regex, '').trim()
    }
  }

  // Check for "in X days/weeks/months/years"
  const inPattern = /\bin\s+(\d+)\s+(day|week|month|year)s?\b/i
  const inMatch = input.match(inPattern)
  if (inMatch) {
    const value = parseInt(inMatch[1], 10)
    const unit = inMatch[2].toLowerCase()
    let targetDate = new Date(now)
    if (unit === 'day') {
      targetDate = addDays(now, value)
    } else if (unit === 'week') {
      targetDate = addDays(now, value * 7)
    } else if (unit === 'month') {
      targetDate = new Date(now.getFullYear(), now.getMonth() + value, now.getDate())
    } else if (unit === 'year') {
      targetDate = new Date(now.getFullYear() + value, now.getMonth(), now.getDate())
    }
    callback(startOfDay(targetDate))
    return input.replace(inMatch[0], '').trim()
  }

  // Check for "next week/month/year"
  const nextPattern = /\bnext\s+(week|month|year)\b/i
  const nextMatch = input.match(nextPattern)
  if (nextMatch) {
    const unit = nextMatch[1].toLowerCase()
    let targetDate = new Date(now)
    if (unit === 'week') {
      targetDate = addDays(now, 7)
    } else if (unit === 'month') {
      targetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    } else if (unit === 'year') {
      targetDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    }
    callback(startOfDay(targetDate))
    return input.replace(nextMatch[0], '').trim()
  }

  for (let i = 0; i < 7; i++) {
    const dayName = DAYS[i]
    const regex = new RegExp(`\\b(?:next\\s+)?${dayName}\\b`, 'i')
    const match = input.match(regex)
    if (match) {
      const targetDay = i
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (daysUntil <= 0) daysUntil += 7

      callback(startOfDay(addDays(now, daysUntil)))
      return input.replace(match[0], '').trim()
    }
  }

  for (let i = 0; i < MONTHS.length; i++) {
    const monthName = MONTHS[i]
    const regex = new RegExp(`\\b${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i')
    const match = input.match(regex)
    if (match) {
      const day = parseInt(match[1], 10)
      const year = now.getFullYear()
      const parsed = new Date(year, i, day)
      if (isValid(parsed)) {
        callback(startOfDay(parsed))
        return input.replace(match[0], '').trim()
      }
    }
  }

  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ]

  for (const pattern of datePatterns) {
    const match = input.match(pattern)
    if (match) {
      let year: number, month: number, day: number

      if (match[3] && match[0].includes('-')) {
        year = parseInt(match[1], 10)
        month = parseInt(match[2], 10) - 1
        day = parseInt(match[3], 10)
      } else {
        month = parseInt(match[1], 10) - 1
        day = parseInt(match[2], 10)
        year = match[3] ? (match[3].length === 2 ? 2000 + parseInt(match[3], 10) : parseInt(match[3], 10)) : now.getFullYear()
      }

      const parsed = new Date(year, month, day)
      if (isValid(parsed)) {
        callback(startOfDay(parsed))
        return input.replace(match[0], '').trim()
      }
    }
  }

  return input
}

function extractPriority(input: string, callback: (priority: 'high' | 'medium' | 'low') => void): string {
  const lowerInput = input.toLowerCase()

  for (const [keyword, prio] of Object.entries(PRIORITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(lowerInput)) {
      callback(prio)
      return input.replace(regex, '').trim()
    }
  }

  const priorityRegex = /!(high|medium|low|h|m|l)/i
  const match = input.match(priorityRegex)
  if (match) {
    const shorthand: Record<string, 'high' | 'medium' | 'low'> = {
      'h': 'high',
      'm': 'medium',
      'l': 'low',
    }
    const value = match[1].toLowerCase()
    callback(shorthand[value] || (value as 'high' | 'medium' | 'low'))
    return input.replace(match[0], '').trim()
  }

  return input
}

export function getNextRecurrenceDate(rule: RecurringRule, fromDate: Date = new Date()): Date {
  const interval = rule.interval || 1
  let nextDate: Date

  switch (rule.pattern) {
    case 'daily': {
      nextDate = addDays(fromDate, interval)
      break
    }
    case 'weekday': {
      nextDate = addDays(fromDate, 1)
      while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
        nextDate = addDays(nextDate, 1)
      }
      break
    }
    case 'weekly': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const currentDay = fromDate.getDay()
        const nextDay = rule.daysOfWeek.find(d => d > currentDay)
        if (nextDay !== undefined) {
          nextDate = addDays(fromDate, nextDay - currentDay)
        } else {
          nextDate = addDays(fromDate, (7 - currentDay) + rule.daysOfWeek[0])
        }
      } else {
        nextDate = addWeeks(fromDate, interval)
      }
      break
    }
    case 'monthly': {
      nextDate = addMonths(fromDate, interval)
      break
    }
    case 'yearly': {
      nextDate = addYears(fromDate, interval)
      break
    }
    default: {
      nextDate = addDays(fromDate, 1)
    }
  }

  return startOfDay(nextDate)
}

export function formatTimeDifference(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
