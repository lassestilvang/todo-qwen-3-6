'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Task, TaskList, Label, ViewType } from '@/lib/types'
import { useCrud } from './use-crud'

export function useTasks(view: ViewType, listId: string | null, showCompleted: boolean) {
  const params: Record<string, string> = {
    view,
    showCompleted: showCompleted.toString(),
  }
  if (listId) params.listId = listId

  const { data: tasks, loading, error, create, update, remove, refresh } = useCrud<Task>({
    baseUrl: '/api/tasks',
    entityName: 'task',
    fetchParams: params,
    createSuccessMessage: 'Task created',
    updateSuccessMessage: 'Task updated',
    deleteSuccessMessage: 'Task deleted',
  })

  const toggleComplete = async (task: Task) => {
    await update(task.id, { completed: !task.completed })
  }

  return {
    tasks,
    loading,
    error,
    createTask: create,
    updateTask: update,
    deleteTask: remove,
    toggleComplete,
    refresh,
  }
}

export function useLists() {
  const crud = useCrud<TaskList>({
    baseUrl: '/api/lists',
    entityName: 'list',
    createSuccessMessage: 'List created',
    updateSuccessMessage: 'List updated',
    deleteSuccessMessage: 'List deleted',
  })

  return {
    lists: crud.data,
    loading: crud.loading,
    error: crud.error,
    createList: crud.create,
    updateList: crud.update,
    deleteList: crud.remove,
    refresh: crud.refresh,
  }
}

export function useLabels() {
  const crud = useCrud<Label>({
    baseUrl: '/api/labels',
    entityName: 'label',
    createSuccessMessage: 'Label created',
    updateSuccessMessage: 'Label updated',
    deleteSuccessMessage: 'Label deleted',
  })

  return {
    labels: crud.data,
    loading: crud.loading,
    error: crud.error,
    createLabel: crud.create,
    updateLabel: crud.update,
    deleteLabel: crud.remove,
    refresh: crud.refresh,
  }
}

export function useSearch(query: string) {
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const doSearch = async () => {
      if (!query.trim()) {
        setResults([])
        setSearchError(null)
        return
      }

      setLoading(true)
      setSearchError(null)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Search failed')
        }
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
    }

    const timer = setTimeout(doSearch, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return { results, loading, error: searchError }
}
