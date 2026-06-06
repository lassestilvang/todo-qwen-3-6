import { useMemo } from 'react'
import { Task } from '@/lib/types'
import { SortBy, SortOrder } from '@/hooks/use-app'

export function useSortedTasks(tasks: Task[], sortBy: SortBy, sortOrder: SortOrder) {
  return useMemo(() => {
    const sorted = [...tasks]
    sorted.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity)
        const dateB = b.date ? new Date(b.date).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity)
        comparison = dateA - dateB
      } else if (sortBy === 'priority') {
        const priorityMap = { high: 1, medium: 2, low: 3, none: 4 }
        comparison = priorityMap[a.priority] - priorityMap[b.priority]
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [tasks, sortBy, sortOrder])
}
