'use client'

import { useState, useMemo, useEffect } from 'react'
import { Task, Priority } from '@/lib/types'
import { KanbanTaskCard } from './kanban-task-card'
import { KanbanQuickAdd } from './kanban-quick-add'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskItem } from './task-item'
import { useTasks } from '@/hooks/use-data'
import { useApp } from '@/hooks/use-app'

interface KanbanBoardProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  selectedTaskId: string | null
  activeTrackedTaskId: string | null
  toggleTimeTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
  currentSessionElapsed: number
}

const COLUMNS: { id: Priority; label: string; color: string }[] = [
  { id: 'high', label: 'High Priority', color: 'bg-red-500' },
  { id: 'medium', label: 'Medium Priority', color: 'bg-amber-500' },
  { id: 'low', label: 'Low Priority', color: 'bg-blue-500' },
  { id: 'none', label: 'No Priority', color: 'bg-zinc-500' },
]
export function KanbanBoard({ tasks: initialTasks, onToggle, onSelect, selectedTaskId, activeTrackedTaskId, toggleTimeTracking, formatTime, currentSessionElapsed }: KanbanBoardProps) {
  const { currentView, currentListId, showCompleted, currentLabelId } = useApp()
  const { updateTask, createTask } = useTasks(currentView, currentListId, showCompleted, currentLabelId)

  const handleQuickAdd = async (name: string, priority: Priority) => {
    await createTask({ name, priority })
  }

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTaskId) return

      const task = initialTasks.find(t => t.id === selectedTaskId)
      if (!task) return

      const colIndex = COLUMNS.findIndex(c => c.id === task.priority)
      if (colIndex === -1) return

      let nextColIndex = colIndex
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nextColIndex = Math.max(0, colIndex - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextColIndex = Math.min(COLUMNS.length - 1, colIndex + 1)
      }

      if (nextColIndex !== colIndex) {
        updateTask(task.id, { priority: COLUMNS[nextColIndex].id })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskId, initialTasks, updateTask])

  const sensors = useSensors(
// ...

    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = active.data.current?.task
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find if we dropped over a column or another task
    let overColumnId: Priority | null = null
    
    // Check if overId is one of the columns
    if (COLUMNS.some(c => c.id === overId)) {
      overColumnId = overId as Priority
    } else {
      // Over another task, get its priority
      const overTask = initialTasks.find(t => t.id === overId)
      if (overTask) overColumnId = overTask.priority
    }

    const activeTask = initialTasks.find(t => t.id === activeId)
    
    if (activeTask && overColumnId && activeTask.priority !== overColumnId) {
      // Update priority
      try {
        await updateTask(activeTask.id, { priority: overColumnId })
      } catch (err) {
        console.error('Failed to update task priority', err)
      }
    }
  }

  if (initialTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-md p-10 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl shadow-2xl flex flex-col items-center group hover:border-primary/30 transition-all duration-500"
        >
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
              <span className="text-4xl text-primary font-bold">K</span>
            </div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-amber-500" />
            </motion.div>
          </div>
          
          <h3 className="text-foreground font-bold text-2xl tracking-tight">Kanban is clear</h3>
          <p className="text-muted-foreground text-base mt-3 max-w-[280px] leading-relaxed">
            Organize your workflow by priority. Ready to start dragging?
          </p>
          
          <div className="flex flex-col gap-3 mt-8 w-full">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.dispatchEvent(new CustomEvent('add-task'))}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Column Task
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex gap-4 p-4 overflow-x-auto custom-scrollbar">
        {COLUMNS.map(column => {
          const columnTasks = initialTasks.filter(t => t.priority === column.id)
          
          return (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-80 flex flex-col bg-secondary/20 rounded-2xl border border-border/40 overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between border-b border-border/40 bg-secondary/30">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", column.color)} />
                  <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full border border-border/40">
                  {columnTasks.length}
                </span>
              </div>
              
              <SortableContext
                id={column.id}
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.map(task => (
                      <KanbanTaskCard
                        key={task.id}
                        task={task}
                        onToggle={onToggle}
                        onSelect={onSelect}
                        isSelected={selectedTaskId === task.id}
                        activeTrackedTaskId={activeTrackedTaskId}
                        toggleTimeTracking={toggleTimeTracking}
                        formatTime={formatTime}
                        currentSessionElapsed={currentSessionElapsed}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {columnTasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-center opacity-40 grayscale">
                      <p className="text-[10px] font-medium text-muted-foreground">No tasks in this column</p>
                    </div>
                  )}
                </div>
              </SortableContext>
              <div className="p-2 border-t border-border/40 bg-secondary/30">
                <KanbanQuickAdd priority={column.id} onAdd={handleQuickAdd} />
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeTask ? (
          <div className="w-72 cursor-grabbing shadow-2xl rounded-xl overflow-hidden ring-2 ring-primary/50">
            <TaskItem
              task={activeTask}
              onToggle={() => {}}
              onSelect={() => {}}
              isSelected={true}
              isMultiSelected={false}
              activeTrackedTaskId={activeTrackedTaskId}
              toggleTimeTracking={toggleTimeTracking}
              formatTime={formatTime}
              currentSessionElapsed={currentSessionElapsed}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
