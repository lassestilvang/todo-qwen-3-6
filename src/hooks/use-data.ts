'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Task, TaskList, Label, ViewType } from '@/lib/types'
import { useCrud } from './use-crud'
import { sounds } from '@/lib/sounds'
import { getNextRecurrenceDate } from '@/lib/natural-language'

export function useTasks(view: ViewType, listId: string | null, showCompleted: boolean, labelId: string | null = null, showOverdue: boolean = false) {
  const params = useMemo(() => {
    const p: Record<string, string> = {
      view,
      showCompleted: showCompleted.toString(),
      showOverdue: showOverdue.toString(),
    }
    if (listId) p.listId = listId
    if (labelId) p.labelId = labelId
    return p
  }, [view, listId, showCompleted, labelId, showOverdue])

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
      sounds.playSuccess()
      window.dispatchEvent(new CustomEvent('trigger-confetti'))
      toast(`"${task.name}" completed`, {
        action: {
          label: 'Undo',
          onClick: () => update(task.id, { completed: false }),
        },
        duration: 5000,
      })

      if (task.recurringRule) {
        const nextDate = getNextRecurrenceDate(task.recurringRule)
        create({
          name: task.name,
          description: task.description,
          listId: task.listId,
          date: nextDate.toISOString(),
          deadline: null,
          estimate: task.estimate,
          priority: task.priority,
          labels: task.labels.map(l => l.id),
          subTasks: task.subTasks.map(st => ({ name: st.name, completed: false, order: st.order })),
          reminders: task.reminders.map(r => ({ type: r.type, time: r.time })),
          recurringRule: task.recurringRule,
        })
      }
    }
  }

  const clearCompleted = async () => {
    try {
      const url = new URL('/api/tasks', window.location.origin)
      if (listId) url.searchParams.append('listId', listId)
      
      const res = await fetch(url.toString(), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear completed tasks')
      
      toast.success('Completed tasks cleared')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to clear completed tasks')
    }
  }

  const restoreTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore task')
      toast.success('Task restored')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to restore task')
    }
  }

  const purgeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}?purge=true`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to permanently delete task')
      toast.success('Task permanently deleted')
      refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to permanently delete task')
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
    clearCompleted,
    restoreTask,
    purgeTask,
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
