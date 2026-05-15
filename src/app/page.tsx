'use client'

import { useState } from 'react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists, useLabels } from '@/hooks/use-data'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Header } from '@/components/layout/header'
import { TaskList } from '@/components/tasks/task-list'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const { currentView, currentListId, selectedTaskId, setSelectedTaskId, sidebarOpen } = useApp()
  const { tasks, loading, error, toggleComplete, deleteTask, updateTask, createTask, refresh } = useTasks(
    currentView,
    currentListId,
    false
  )
  const { lists } = useLists()
  const { labels } = useLabels()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  const handleSelectTask = (task: any) => {
    setSelectedTaskId(task.id)
    setShowTaskDetail(true)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = () => {
    setEditingTask(selectedTask)
    setShowTaskForm(true)
    setShowTaskDetail(false)
  }

  const handleSaveTask = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      await createTask(data)
    }
    setShowTaskForm(false)
    setEditingTask(null)
  }

  const handleDeleteTask = async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id)
      setShowTaskDetail(false)
      setSelectedTaskId(null)
    }
  }

  const listData = lists.find(l => l.id === currentListId)

  return (
    <div className="h-screen flex bg-zinc-950 text-white">
      <Sidebar />

      <motion.main
        animate={{ marginLeft: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col min-w-0"
      >
        <Header onAddTask={handleAddTask} />

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400">{error}</p>
                <button onClick={refresh} className="text-sm text-zinc-400 hover:text-white mt-2">
                  Try again
                </button>
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                onToggle={toggleComplete}
                onSelect={handleSelectTask}
                selectedTaskId={selectedTaskId}
              />
            )}
          </div>

          <AnimatePresence>
            {showTaskDetail && selectedTask && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-zinc-800 overflow-hidden"
              >
                <TaskDetail
                  task={selectedTask}
                  onClose={() => {
                    setShowTaskDetail(false)
                    setSelectedTaskId(null)
                  }}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
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
