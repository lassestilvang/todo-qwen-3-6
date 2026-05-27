'use client'

import { Task } from '@/lib/types'
import { TaskItem } from './task-item'
import { AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  selectedTaskId: string | null
}

export function TaskList({ tasks, onToggle, onSelect, selectedTaskId }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-zinc-400 font-medium">No tasks yet</h3>
        <p className="text-zinc-600 text-sm mt-1">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar scroller">
      <div className="indicator-top" />
      <div className="space-y-2.5 p-4 pr-3">
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onSelect={onSelect}
              isSelected={selectedTaskId === task.id}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="indicator-bottom" />
    </div>
  )
}


