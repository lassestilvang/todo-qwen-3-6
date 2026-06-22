import { useState, useEffect, useCallback, useRef } from 'react'
import { Task } from '@/lib/types'
import { toast } from 'sonner'

interface UseTaskOperationsProps {
  tasks: Task[]
  createTask: (data: Record<string, unknown>) => Promise<unknown>
  updateTask: (id: string, data: Record<string, unknown>) => Promise<unknown>
  deleteTask: (id: string) => Promise<unknown>
  toggleComplete: (task: Task) => Promise<unknown>
  restoreTask: (id: string) => Promise<unknown>
  purgeTask: (id: string) => Promise<unknown>
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
  const deletedTasksRef = useRef<Map<string, Task>>(new Map())

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    const handleAddTaskEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ priority?: string; date?: string }>
      if (customEvent.detail) {
        setEditingTask({
          id: '',
          name: '',
          description: '',
          completed: false,
          priority: customEvent.detail.priority || 'none',
          date: customEvent.detail.date || null,
          deadline: null,
          listId: '',
          estimate: null,
          actualTime: null,
          labels: [],
          subTasks: [],
          reminders: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any)
      } else {
        setEditingTask(null)
      }
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
    const taskToDelete = selectedTask
    try {
      await deleteTask(taskToDelete.id)
      deletedTasksRef.current.set(taskToDelete.id, taskToDelete)
      setShowTaskDetail(false)
      setSelectedTaskId(null)
      toast(`"${taskToDelete.name}" moved to trash`, {
        action: {
          label: 'Undo',
          onClick: () => createTask({
            ...taskToDelete,
            labels: taskToDelete.labels.map(l => l.id),
            subTasks: taskToDelete.subTasks.map(st => ({ name: st.name, completed: st.completed, order: st.order })),
            reminders: taskToDelete.reminders.map(r => ({ type: r.type, time: r.time })),
          }),
        },
        duration: 5000,
      })
    } catch {
      // Error already handled by toast in use-data.ts
    }
  }

  const handleDuplicateTask = async () => {
    if (!selectedTask) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, completed: _completed, attachments: _attachments, labels, subTasks, reminders, ...rest } = selectedTask
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
    const deletedIds = [...selectedTaskIds]
    const batchTasks = tasks.filter(t => deletedIds.includes(t.id))
    try {
      await Promise.all(deletedIds.map(id => deleteTask(id)))
      batchTasks.forEach(t => deletedTasksRef.current.set(t.id, t))
      setSelectedTaskIds([])
      toast(`${deletedIds.length} tasks moved to trash`, {
        action: {
          label: 'Undo',
          onClick: () => Promise.all(batchTasks.map(t =>
            createTask({
              ...t,
              labels: t.labels.map(l => l.id),
              subTasks: t.subTasks.map(st => ({ name: st.name, completed: st.completed, order: st.order })),
              reminders: t.reminders.map(r => ({ type: r.type, time: r.time })),
            })
          )),
        },
        duration: 5000,
      })
    } catch {
      // Error handled by use-data.ts
    }
  }

  const handleBatchToggle = async () => {
    if (selectedTaskIds.length === 0) return
    const toggleIds = [...selectedTaskIds]
    try {
      const selectedTasks = tasks.filter(t => toggleIds.includes(t.id))
      await Promise.all(selectedTasks.map(t => toggleComplete(t)))
      setSelectedTaskIds([])
      const allCompleted = selectedTasks.every(t => !t.completed)
      toast(allCompleted ? `${toggleIds.length} tasks completed` : `${toggleIds.length} tasks restored`, {
        action: {
          label: 'Undo',
          onClick: () => Promise.all(selectedTasks.map(t => updateTask(t.id, { completed: !t.completed }))),
        },
        duration: 5000,
      })
    } catch {
      // Error handled by use-data.ts
    }
  }

  const handleRestoreTask = async () => {
    if (selectedTaskIds.length > 0) {
      try {
        await Promise.all(selectedTaskIds.map(id => restoreTask(id)))
        setSelectedTaskIds([])
        toast(`${selectedTaskIds.length} tasks restored`, {
          action: {
            label: 'Undo',
            onClick: () => Promise.all(selectedTaskIds.map(id => deleteTask(id))),
          },
          duration: 5000,
        })
      } catch {}
    } else if (selectedTaskId) {
      const restoredId = selectedTaskId
      try {
        await restoreTask(restoredId)
        setShowTaskDetail(false)
        setSelectedTaskId(null)
        toast('Task restored', {
          action: {
            label: 'Undo',
            onClick: () => deleteTask(restoredId),
          },
          duration: 5000,
        })
      } catch {}
    }
  }

  const handlePurgeTask = async () => {
    if (selectedTaskIds.length > 0) {
      try {
        await Promise.all(selectedTaskIds.map(id => purgeTask(id)))
        setSelectedTaskIds([])
        toast(`${selectedTaskIds.length} tasks permanently deleted`)
      } catch {}
    } else if (selectedTaskId) {
      try {
        await purgeTask(selectedTaskId)
        setShowTaskDetail(false)
        setSelectedTaskId(null)
      } catch {}
    }
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
