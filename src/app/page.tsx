'use client'

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists, useLabels } from '@/hooks/use-data'
import { useSortedTasks } from '@/hooks/use-sorted-tasks'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Header } from '@/components/layout/header'
import { TaskList } from '@/components/tasks/task-list'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { MultiSelectBar } from '@/components/tasks/multi-select-bar'
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Task } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Home() {
  const { 
    currentView, currentListId, currentLabelId, selectedTaskId, setSelectedTaskId, 
    selectedTaskIds, setSelectedTaskIds, toggleTaskSelection,
    sidebarOpen, showCompleted, viewMode, sortBy, sortOrder,
    focusMode
  } = useApp()
  const { tasks: rawTasks, loading, error, toggleComplete, deleteTask, updateTask, createTask, clearCompleted, refresh } = useTasks(
    currentView,
    currentListId,
    showCompleted,
    currentLabelId
  )


  const tasks = useSortedTasks(rawTasks, sortBy, sortOrder)

  const { lists } = useLists()
  const { labels } = useLabels()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return
      }

      if (tasks.length === 0) return

      const currentIndex = tasks.findIndex(t => t.id === selectedTaskId)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % tasks.length
        setSelectedTaskId(tasks[nextIndex].id)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + tasks.length) % tasks.length
        setSelectedTaskId(tasks[prevIndex].id)
      } else if (e.key === 'Enter' && selectedTaskId) {
        e.preventDefault()
        setShowTaskDetail(true)
      } else if (e.key === 'Escape') {
        if (showTaskDetail) {
          setShowTaskDetail(false)
        } else if (selectedTaskId) {
          setSelectedTaskId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tasks, selectedTaskId, setSelectedTaskId, showTaskDetail])

  useEffect(() => {
    const handleAddTaskEvent = () => {
      setEditingTask(null)
      setShowTaskForm(true)
    }
    window.addEventListener('add-task', handleAddTaskEvent)
    return () => window.removeEventListener('add-task', handleAddTaskEvent)
  }, [])

  const handleSelectTask = (task: Task, isMultiSelect?: boolean) => {
    if (isMultiSelect) {
      toggleTaskSelection(task.id)
      setSelectedTaskId(null)
      setShowTaskDetail(false)
    } else {
      setSelectedTaskId(task.id)
      setSelectedTaskIds([])
      setShowTaskDetail(true)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = () => {
    if (selectedTask) {
      setEditingTask(selectedTask)
      setShowTaskForm(true)
      setShowTaskDetail(false)
    }
  }

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

  return (
    <div className={cn("h-screen flex bg-background text-foreground overflow-hidden transition-all duration-500", focusMode && "bg-background/95")}>
      {!focusMode && <Sidebar tasks={tasks} />}

      <motion.main
        animate={{ marginLeft: (sidebarOpen && !focusMode) ? 280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-w-0"
      >
        <Header 
          onAddTask={handleAddTask} 
          taskCount={tasks.length} 
          tasks={tasks} 
          onClearCompleted={clearCompleted} 
        />


        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <TaskListSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400">{error}</p>
                <button type="button" onClick={refresh} className="text-sm text-muted-foreground hover:text-foreground mt-2">
                  Try again
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView + (currentListId || '') + (currentLabelId || '') + viewMode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {viewMode === 'list' ? (
                    <TaskList
                      tasks={tasks}
                      onToggle={toggleComplete}
                      onSelect={handleSelectTask}
                      selectedTaskId={selectedTaskId}
                      selectedTaskIds={selectedTaskIds}
                    />
                  ) : (
                    <KanbanBoard
                      tasks={tasks}
                      onToggle={toggleComplete}
                      onSelect={handleSelectTask}
                      selectedTaskId={selectedTaskId}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <AnimatePresence>
            {showTaskDetail && selectedTask && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border bg-card/30 backdrop-blur-md overflow-hidden"
              >
                <TaskDetail
                  task={selectedTask}
                  onClose={() => {
                    setShowTaskDetail(false)
                    setSelectedTaskId(null)
                  }}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onDuplicate={handleDuplicateTask}
                  onUpdate={updateTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <MultiSelectBar
          selectedCount={selectedTaskIds.length}
          onDeselectAll={() => setSelectedTaskIds([])}
          onToggleComplete={handleBatchToggle}
          onDelete={handleBatchDelete}
          onMoveToList={() => {}}
        />
      </motion.main>

      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border overflow-hidden">
          <TaskForm
            task={editingTask}
            lists={lists}
            labels={labels}
            onSave={handleSaveTask}
            onClose={() => {
              setShowTaskForm(false)
              setEditingTask(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
