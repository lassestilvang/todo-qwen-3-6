'use client'

import { Task, Priority } from '@/lib/types'
import { TaskItem } from './task-item'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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

export function KanbanBoard({ tasks, onToggle, onSelect, selectedTaskId }: KanbanBoardProps) {
  return (
    <div className="h-full flex gap-4 p-4 overflow-x-auto custom-scrollbar">
      {COLUMNS.map(column => {
        const columnTasks = tasks.filter(t => t.priority === column.id)
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-secondary/20 rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b border-border/40 bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", column.color)} />
                <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full border border-border/40">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {columnTasks.map(task => (
                  <TaskItem
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
          </div>
        )
      })}
    </div>
  )
}
