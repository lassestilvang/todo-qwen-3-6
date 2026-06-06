import { useState, useEffect, useCallback } from 'react'
import { Task } from '@/lib/types'
import { toast } from 'sonner'

interface UseTaskOperationsProps {
  tasks: Task[]
  createTask: (data: any) => Promise<any>
  updateTask: (id: string, data: any) => Promise<any>
  deleteTask: (id: string) => Promise<any>
  toggleComplete: (task: Task) => Promise<any>
  restoreTask: (id: string) => Promise<any>
  purgeTask: (id: string) => Promise<any>
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  selectedTaskIds: string[]
  setSelectedTaskIds: (ids: string[]) => void
  toggleTaskSelection: (id: string) => void
}

export function useTaskOperations({
  tasks,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
  restoreTask,
  purgeTask,
  selectedTaskId,
  setSelectedTaskId,
  selectedTaskIds,
  setSelectedTaskIds,
  toggleTaskSelection
}: UseTaskOperationsProps) {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    const handleAddTaskEvent = () => {
      setEditingTask(null)
      setShowTaskForm(true)
    }
    window.addEventListener('add-task', handleAddTaskEvent)
    return () => window.removeEventListener('add-task', handleAddTaskEvent)
  }, [])

  const handleSelectTask = useCallback((task: Task, isMultiSelect?: boolean) => {
    if (isMultiSelect) {
      toggleTaskSelection(task.id)
      setSelectedTaskId(null)
      setShowTaskDetail(false)
    } else {
      setSelectedTaskId(task.id)
      setSelectedTaskIds([])
      setShowTaskDetail(true)
    }
  }, [toggleTaskSelection, setSelectedTaskId, setSelectedTaskIds])

  const handleAddTask = useCallback(() => {
    setEditingTask(null)
    setShowTaskForm(true)
  }, [])

  const handleEditTask = useCallback(() => {
    if (selectedTask) {
      setEditingTask(selectedTask)
      setShowTaskForm(true)
      setShowTaskDetail(false)
    }
  }, [selectedTask])

  const handleSaveTask = async (data: Record<string, unknown>) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
      } else {
        await createTask(data)
      }
      setShowTaskForm(false)
      setEditingTask(null)
    } catch {
      // Error already handled by toast in use-data.ts, keep form open
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return
    try {
      await deleteTask(selectedTask.id)
      setShowTaskDetail(false)
      setSelectedTaskId(null)
    } catch {
      // Error already handled by toast in use-data.ts
    }
  }

  const handleDuplicateTask = async () => {
    if (!selectedTask) return
    try {
      const { id, createdAt, updatedAt, completedAt, completed, labels, subTasks, reminders, attachments, ...rest } = selectedTask
      await createTask({
        ...rest,
        name: `${rest.name} (Copy)`,
        labels: labels.map(l => l.id),
        subTasks: subTasks.map(st => ({ name: st.name, completed: false, order: st.order })),
        reminders: reminders.map(r => ({ type: r.type, time: r.time })),
      })
      toast.success('Task duplicated')
    } catch {
      // Error handled by use-data.ts
    }
  }

  const handleBatchDelete = async () => {
    if (selectedTaskIds.length === 0) return
    try {
      await Promise.all(selectedTaskIds.map(id => deleteTask(id)))
      setSelectedTaskIds([])
    } catch {
      // Error handled by use-data.ts
    }
  }

  const handleBatchToggle = async () => {
    if (selectedTaskIds.length === 0) return
    try {
      const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id))
      await Promise.all(selectedTasks.map(t => toggleComplete(t)))
      setSelectedTaskIds([])
    } catch {
      // Error handled by use-data.ts
    }
  }

  const handleRestoreTask = async () => {
    if (!selectedTaskId) return
    try {
      await restoreTask(selectedTaskId)
      setShowTaskDetail(false)
      setSelectedTaskId(null)
    } catch {}
  }

  const handlePurgeTask = async () => {
    if (!selectedTaskId) return
    try {
      await purgeTask(selectedTaskId)
      setShowTaskDetail(false)
      setSelectedTaskId(null)
    } catch {}
  }

  return {
    showTaskForm,
    setShowTaskForm,
    showTaskDetail,
    setShowTaskDetail,
    editingTask,
    selectedTask,
    handleSelectTask,
    handleAddTask,
    handleEditTask,
    handleSaveTask,
    handleDeleteTask,
    handleDuplicateTask,
    handleBatchDelete,
    handleBatchToggle,
    handleRestoreTask,
    handlePurgeTask
  }
}
