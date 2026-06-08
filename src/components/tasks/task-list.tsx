'use client'

import { Task } from '@/lib/types'
import { TaskItem } from './task-item'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, Sparkles, Rocket, Zap, Plus } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task, isMultiSelect?: boolean) => void
  selectedTaskId: string | null
  selectedTaskIds: string[]
  activeTrackedTaskId: string | null
  toggleTimeTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
  currentSessionElapsed: number
}

export function TaskList({ 
  tasks, 
  onToggle, 
  onSelect, 
  selectedTaskId, 
  selectedTaskIds,
  activeTrackedTaskId,
  toggleTimeTracking,
  formatTime,
  currentSessionElapsed
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none overflow-hidden relative">
        {/* Decorative background elements */}
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
              <ClipboardList className="w-10 h-10 text-primary" />
            </div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </motion.div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
              className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </motion.div>
          </div>
          
          <h3 className="text-foreground font-bold text-2xl tracking-tight">Focus on what matters</h3>
          <p className="text-muted-foreground text-base mt-3 max-w-[280px] leading-relaxed">
            Your workspace is perfectly clear. Ready to plan your next big win?
          </p>
          
          <div className="flex flex-col gap-3 mt-8 w-full">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.dispatchEvent(new CustomEvent('add-task'))}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Task
            </motion.button>
            
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
              Pro Tip: Press <kbd className="bg-secondary px-1.5 py-0.5 rounded border border-border/60 mx-1">N</kbd> anywhere
            </p>
          </div>
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
              activeTrackedTaskId={activeTrackedTaskId}
              toggleTimeTracking={toggleTimeTracking}
              formatTime={formatTime}
              currentSessionElapsed={currentSessionElapsed}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="indicator-bottom" />
    </div>
  )
}


