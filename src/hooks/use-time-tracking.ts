import { useState, useEffect, useCallback, useRef } from 'react'
import { Task, ViewType } from '@/lib/types'
import { useTasks } from './use-data' // Assuming useTasks provides updateTask

interface UseTimeTrackingResult {
  activeTaskId: string | null
  timeElapsed: number // in seconds
  startTracking: (taskId: string) => void
  stopTracking: () => void
  toggleTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
}

export function useTimeTracking(currentView: ViewType, currentListId: string | null, showCompleted: boolean, currentLabelId: string | null): UseTimeTrackingResult {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null) // Unix timestamp
  const [timeElapsed, setTimeElapsed] = useState<number>(0) // for current session display

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { updateTask, tasks } = useTasks(currentView, currentListId, showCompleted, currentLabelId)

  // Load from localStorage on mount
  useEffect(() => {
    const savedActiveTaskId = localStorage.getItem('time_tracker_active_task_id')
    const savedStartTime = localStorage.getItem('time_tracker_start_time')

    if (savedActiveTaskId && savedStartTime) {
      setActiveTaskId(savedActiveTaskId)
      setStartTime(parseInt(savedStartTime, 10))
    }
  }, [])

  // Start/stop interval based on activeTaskId and startTime
  useEffect(() => {
    if (activeTaskId && startTime !== null) {
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setTimeElapsed(elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setTimeElapsed(0) // Reset display when not active
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTaskId, startTime])

  // Persist to localStorage
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
          actualTime: formatTime(newTotalSeconds), // Update formatted string as well
        })
      }
    }
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
