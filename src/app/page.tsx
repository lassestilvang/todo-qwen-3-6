'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists, useLabels } from '@/hooks/use-data'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Header } from '@/components/layout/header'
import { TaskList } from '@/components/tasks/task-list'
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Task } from '@/lib/types'

export default function Home() {
  const { currentView, currentListId, currentLabelId, selectedTaskId, setSelectedTaskId, sidebarOpen, showCompleted } = useApp()
  const { tasks, loading, error, toggleComplete, deleteTask, updateTask, createTask, refresh } = useTasks(
    currentView,
    currentListId,
    showCompleted,
    currentLabelId
  )
  const { lists } = useLists()
  const { labels } = useLabels()

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

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id)
    setShowTaskDetail(true)
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

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      <motion.main
        animate={{ marginLeft: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col min-w-0"
      >
        <Header onAddTask={handleAddTask} taskCount={tasks.length} tasks={tasks} />

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
                  key={currentView + (currentListId || '') + (currentLabelId || '')}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <TaskList
                    tasks={tasks}
                    onToggle={toggleComplete}
                    onSelect={handleSelectTask}
                    selectedTaskId={selectedTaskId}
                  />
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
                  onUpdate={updateTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

