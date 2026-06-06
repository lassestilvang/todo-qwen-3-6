'use client'

import { useState, useMemo } from 'react'
import { Task, Priority } from '@/lib/types'
import { KanbanTaskCard } from './kanban-task-card'
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
}

const COLUMNS: { id: Priority; label: string; color: string }[] = [
  { id: 'high', label: 'High Priority', color: 'bg-red-500' },
  { id: 'medium', label: 'Medium Priority', color: 'bg-amber-500' },
  { id: 'low', label: 'Low Priority', color: 'bg-blue-500' },
  { id: 'none', label: 'No Priority', color: 'bg-zinc-500' },
]

export function KanbanBoard({ tasks: initialTasks, onToggle, onSelect, selectedTaskId }: KanbanBoardProps) {
  const { currentView, currentListId, showCompleted, currentLabelId } = useApp()
  const { updateTask } = useTasks(currentView, currentListId, showCompleted, currentLabelId)
  
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  const sensors = useSensors(
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
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
