'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Task, TaskList, Label, ViewType } from '@/lib/types'

export function useTasks(view: ViewType, listId: string | null, showCompleted: boolean) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        view,
        showCompleted: showCompleted.toString(),
      })
      if (listId) params.set('listId', listId)

      const res = await fetch(`/api/tasks?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [view, listId, showCompleted])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (taskData: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const message = errData.error || 'Failed to create task'
        const details = (errData.details as Array<{ path?: string[]; message?: string }> | undefined)
          ?.map(d => `${d.path?.join('.')}: ${d.message}`)
          .join(', ')
        throw new Error(details ? `${message}: ${details}` : message)
      }
      await fetchTasks()
      toast.success('Task created')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const updateTask = async (id: string, taskData: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update task')
      }
      await fetchTasks()
      toast.success('Task updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      await fetchTasks()
      toast.success('Task deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const toggleComplete = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed })
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refresh: fetchTasks,
  }
}

export function useLists() {
  const [lists, setLists] = useState<TaskList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lists')
      if (!res.ok) throw new Error('Failed to fetch lists')
      const data = await res.json()
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const createList = async (data: { name: string; color: string; emoji: string }) => {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create list')
      await fetchLists()
      toast.success('List created')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const updateList = async (id: string, data: Partial<{ name: string; color: string; emoji: string }>) => {
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update list')
      await fetchLists()
      toast.success('List updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const deleteList = async (id: string) => {
    try {
      const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete list')
      await fetchLists()
      toast.success('List deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  return { lists, loading, error, createList, updateList, deleteList, refresh: fetchLists }
}

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLabels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/labels')
      if (!res.ok) throw new Error('Failed to fetch labels')
      const data = await res.json()
      setLabels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  const createLabel = async (data: { name: string; color: string; icon: string }) => {
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create label')
      await fetchLabels()
      toast.success('Label created')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const updateLabel = async (id: string, data: Partial<{ name: string; color: string; icon: string }>) => {
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update label')
      await fetchLabels()
      toast.success('Label updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const deleteLabel = async (id: string) => {
    try {
      const res = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete label')
      await fetchLabels()
      toast.success('Label deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  return { labels, loading, error, createLabel, updateLabel, deleteLabel, refresh: fetchLabels }
}

export function useSearch(query: string) {
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearchError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setSearchError(null)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        if (!cancelled) {
          setResults(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err instanceof Error ? err.message : 'Search failed')
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return { results, loading, error: searchError }
}
