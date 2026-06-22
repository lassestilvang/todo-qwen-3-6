'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists, useLabels } from '@/hooks/use-data'
import { useSortedTasks } from '@/hooks/use-sorted-tasks'
import { useTaskOperations } from '@/hooks/use-task-operations'
import { useTimeTracking } from '@/hooks/use-time-tracking'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Header } from '@/components/layout/header'
import { TaskList } from '@/components/tasks/task-list'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { EisenhowerMatrix } from '@/components/tasks/eisenhower-matrix'
import { MultiSelectBar } from '@/components/tasks/multi-select-bar'
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Home() {
  const { 
    currentView, currentListId, currentLabelId, selectedTaskId, setSelectedTaskId, 
    selectedTaskIds, setSelectedTaskIds, toggleTaskSelection,
    sidebarOpen, showCompleted, showOverdue, viewMode, sortBy, sortOrder,
    focusMode
  } = useApp()
  const { tasks: rawTasks, loading, error, toggleComplete, deleteTask, updateTask, createTask, clearCompleted, restoreTask, purgeTask, refresh } = useTasks(
    currentView,
    currentListId,
    showCompleted,
    currentLabelId,
    showOverdue
  )


  const tasks = useSortedTasks(rawTasks, sortBy, sortOrder)
  const { lists } = useLists()
  const { labels } = useLabels()
  const { activeTaskId: activeTrackedTaskId, timeElapsed: currentSessionElapsed, toggleTracking: toggleTimeTracking, formatTime } = useTimeTracking(
    currentView, currentListId, showCompleted, currentLabelId
  )

  const [showMoveToList, setShowMoveToList] = useState(false)

  const handleMoveToList = async (listId: string | null) => {
    try {
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { listId })))
      toast.success(`Moved ${selectedTaskIds.length} tasks`)
      setSelectedTaskIds([])
    } catch {
      toast.error('Failed to move tasks')
    }
    setShowMoveToList(false)
  }

  const {
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
  } = useTaskOperations({
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
  })

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

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % tasks.length
        setSelectedTaskId(tasks[nextIndex].id)
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
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
  }, [tasks, selectedTaskId, setSelectedTaskId, showTaskDetail, setShowTaskDetail])

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
          onEmptyTrash={async () => {
            const res = await fetch('/api/tasks?purgeTrash=true', { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to empty trash')
            toast.success('Trash emptied', {
              description: 'All tasks permanently deleted.',
            })
            refresh()
          }}
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
                      onUpdateTask={updateTask}
                      activeTrackedTaskId={activeTrackedTaskId}
                      toggleTimeTracking={toggleTimeTracking}
                      formatTime={formatTime}
                      currentSessionElapsed={currentSessionElapsed}
                    />
                  ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                      tasks={tasks}
                      onToggle={toggleComplete}
                      onSelect={handleSelectTask}
                      selectedTaskId={selectedTaskId}
                      activeTrackedTaskId={activeTrackedTaskId}
                      toggleTimeTracking={toggleTimeTracking}
                      formatTime={formatTime}
                      currentSessionElapsed={currentSessionElapsed}
                      onUpdateTask={updateTask}
                    />
                  ) : (
                    <EisenhowerMatrix
                      tasks={tasks}
                      onToggle={toggleComplete}
                      onSelect={handleSelectTask}
                      selectedTaskId={selectedTaskId}
                      activeTrackedTaskId={activeTrackedTaskId}
                      toggleTimeTracking={toggleTimeTracking}
                      formatTime={formatTime}
                      currentSessionElapsed={currentSessionElapsed}
                      onUpdateTask={updateTask}
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
                  onRestore={handleRestoreTask}
                  onPurge={handlePurgeTask}
                  allTasks={tasks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <MultiSelectBar
          selectedCount={selectedTaskIds.length}
          onDeselectAll={() => setSelectedTaskIds([])}
          onToggleComplete={currentView === 'trash' ? handleRestoreTask : handleBatchToggle}
          onDelete={currentView === 'trash' ? handlePurgeTask : handleBatchDelete}
          onMoveToList={() => setShowMoveToList(true)}
          labels={currentView === 'trash' ? { toggle: 'Restore', delete: 'Purge' } : undefined}
        />
      </motion.main>

      <Dialog open={showMoveToList} onOpenChange={setShowMoveToList}>
        <DialogContent className="max-w-xs bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl">
          <h3 className="text-sm font-bold mb-3">Move {selectedTaskIds.length} tasks to...</h3>
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleMoveToList(null)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
            >
              No list
            </button>
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => handleMoveToList(list.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/70 transition-colors flex items-center gap-2"
              >
                <span>{list.emoji}</span>
                <span>{list.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border overflow-hidden">
          <TaskForm
            task={editingTask}
            lists={lists}
            labels={labels}
            onSave={handleSaveTask}
            onClose={() => {
              setShowTaskForm(false)
            }}
            defaultListId={currentListId}
            defaultDate={currentView === 'today' ? new Date() : currentView === 'week' ? new Date() : null}
            allTasks={tasks}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
