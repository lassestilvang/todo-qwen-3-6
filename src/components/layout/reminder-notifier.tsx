'use client'

import { useEffect, useRef } from 'react'

export function ReminderNotifier() {
  const notifiedRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const checkReminders = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      try {
        const res = await fetch('/api/tasks?view=upcoming&showCompleted=true')
        if (!res.ok) return
        const tasks = await res.json()

        const now = new Date()
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

        for (const task of tasks) {
          if (!task.reminders) continue
          for (const reminder of task.reminders) {
            if (notifiedRef.current.has(reminder.id)) continue
            const reminderTime = new Date(reminder.time)
            if (reminderTime > now && reminderTime <= fiveMinutesFromNow) {
              notifiedRef.current.add(reminder.id)
              new Notification(`Reminder: ${task.name}`, {
                body: reminder.type === 'email' ? 'Email reminder scheduled' : `${task.name} is due soon`,
                icon: '/favicon.ico',
                tag: reminder.id,
              })
            }
          }
        }
      } catch {
        // Silently fail - notifications are best-effort
      }
    }

    checkReminders()
    intervalRef.current = setInterval(checkReminders, 60_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
