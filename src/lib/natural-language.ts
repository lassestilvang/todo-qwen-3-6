import { addDays, addWeeks, addMonths, addYears, startOfDay, nextDay, parse, isValid } from 'date-fns'

interface ParsedTask {
  name: string
  date: Date | null
  time: string | null
  priority: 'high' | 'medium' | 'low' | 'none'
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
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

  const now = new Date()

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
  }
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

export function formatTimeDifference(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
