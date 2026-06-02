'use client'

import { Task } from '@/lib/types'
import { TaskItem } from './task-item'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task, isMultiSelect?: boolean) => void
  selectedTaskId: string | null
  selectedTaskIds: string[]
}

export function TaskList({ tasks, onToggle, onSelect, selectedTaskId, selectedTaskIds }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
          className="max-w-md p-8 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md shadow-xl flex flex-col items-center group hover:border-border/80 transition-colors duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <ClipboardList className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          <h3 className="text-foreground font-semibold text-lg tracking-tight">Your task workspace is clear</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-[260px] leading-relaxed">
            Create your first task to plan, track, and conquer your goals with high productivity!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent('add-task'))}
            className="mt-6 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-xs shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 cursor-pointer"
          >
            Create Task
          </motion.button>
        </motion.div>
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
              isMultiSelected={selectedTaskIds.includes(task.id)}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="indicator-bottom" />
    </div>
  )
}


