'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Task, TaskList, Label, ViewType } from '@/lib/types'
import { useCrud } from './use-crud'

export function useTasks(view: ViewType, listId: string | null, showCompleted: boolean, labelId: string | null = null) {
  const params = useMemo(() => {
    const p: Record<string, string> = {
      view,
      showCompleted: showCompleted.toString(),
    }
    if (listId) p.listId = listId
    if (labelId) p.labelId = labelId
    return p
  }, [view, listId, showCompleted, labelId])

  const { data: tasks, loading, error, create, update, remove, refresh, isMutating } = useCrud<Task>({
    baseUrl: '/api/tasks',
    entityName: 'task',
    fetchParams: params,
    createSuccessMessage: 'Task created',
    updateSuccessMessage: 'Task updated',
    deleteSuccessMessage: 'Task deleted',
  })

  const toggleComplete = async (task: Task) => {
    const nextCompletedState = !task.completed
    await update(task.id, { completed: nextCompletedState })
    if (nextCompletedState) {
      window.dispatchEvent(new CustomEvent('trigger-confetti'))
    }
  }

  return {
    tasks,
    loading,
    error,
    isMutating,
    createTask: create,
    updateTask: update,
    deleteTask: remove,
    toggleComplete,
    refresh,
  }
}

export function useLists() {
  const { data: lists, loading, error, create, update, remove, refresh, isMutating } = useCrud<TaskList>({
    baseUrl: '/api/lists',
    entityName: 'list',
    createSuccessMessage: 'List created',
    updateSuccessMessage: 'List updated',
    deleteSuccessMessage: 'List deleted',
  })

  return {
    lists,
    loading,
    error,
    isMutating,
    createList: create,
    updateList: update,
    deleteList: remove,
    refresh,
  }
}

export function useLabels() {
  const { data: labels, loading, error, create, update, remove, refresh, isMutating } = useCrud<Label>({
    baseUrl: '/api/labels',
    entityName: 'label',
    createSuccessMessage: 'Label created',
    updateSuccessMessage: 'Label updated',
    deleteSuccessMessage: 'Label deleted',
  })

  return {
    labels,
    loading,
    error,
    isMutating,
    createLabel: create,
    updateLabel: update,
    deleteLabel: remove,
    refresh,
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
