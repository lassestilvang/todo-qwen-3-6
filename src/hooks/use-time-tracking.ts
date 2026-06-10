import { useState, useEffect, useCallback, useRef } from 'react'
import { ViewType } from '@/lib/types'
import { useTasks } from './use-data'

interface UseTimeTrackingResult {
  activeTaskId: string | null
  timeElapsed: number
  startTracking: (taskId: string) => void
  stopTracking: () => void
  toggleTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
}

function getInitialActiveTaskId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('time_tracker_active_task_id')
}

function getInitialStartTime(): number | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('time_tracker_start_time')
  return saved ? parseInt(saved, 10) : null
}

export function useTimeTracking(currentView: ViewType, currentListId: string | null, showCompleted: boolean, currentLabelId: string | null): UseTimeTrackingResult {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(getInitialActiveTaskId)
  const [startTime, setStartTime] = useState<number | null>(getInitialStartTime)
  const [timeElapsed, setTimeElapsed] = useState<number>(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { updateTask, tasks } = useTasks(currentView, currentListId, showCompleted, currentLabelId)

  const isActive = activeTaskId !== null && startTime !== null

  useEffect(() => {
    if (isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime!) / 1000)
        setTimeElapsed(elapsed)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTaskId, startTime, isActive])

  useEffect(() => {
    if (activeTaskId && startTime !== null) {
      localStorage.setItem('time_tracker_active_task_id', activeTaskId)
      localStorage.setItem('time_tracker_start_time', startTime.toString())
    } else {
      localStorage.removeItem('time_tracker_active_task_id')
      localStorage.removeItem('time_tracker_start_time')
    }
  }, [activeTaskId, startTime])

  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }, [])

  const startTracking = useCallback((taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      if (activeTaskId && startTime !== null) {
        const task = tasks.find(t => t.id === activeTaskId)
        if (task) {
          const currentTotalSeconds = task.actualTimeSeconds || 0
          const sessionElapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          const newTotalSeconds = currentTotalSeconds + sessionElapsedSeconds
          updateTask(activeTaskId, {
            actualTimeSeconds: newTotalSeconds,
            actualTime: formatTime(newTotalSeconds),
          })
        }
        setActiveTaskId(null)
        setStartTime(null)
      }
    }
    setActiveTaskId(taskId)
    setStartTime(Date.now())
  }, [activeTaskId, startTime, tasks, updateTask, formatTime])

  const stopTracking = useCallback(async () => {
    if (activeTaskId && startTime !== null) {
      const task = tasks.find(t => t.id === activeTaskId)
      if (task) {
        const currentTotalSeconds = task.actualTimeSeconds || 0
        const sessionElapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        const newTotalSeconds = currentTotalSeconds + sessionElapsedSeconds

        await updateTask(activeTaskId, {
          actualTimeSeconds: newTotalSeconds,
          actualTime: formatTime(newTotalSeconds),
        })
      }
    }
    setTimeElapsed(0)
    setActiveTaskId(null)
    setStartTime(null)
  }, [activeTaskId, startTime, tasks, updateTask, formatTime])

  const toggleTracking = useCallback((taskId: string) => {
    if (activeTaskId === taskId) {
      stopTracking()
    } else {
      startTracking(taskId)
    }
  }, [activeTaskId, startTracking, stopTracking])

  return {
    activeTaskId,
    timeElapsed,
    startTracking,
    stopTracking,
    toggleTracking,
    formatTime,
  }
}
