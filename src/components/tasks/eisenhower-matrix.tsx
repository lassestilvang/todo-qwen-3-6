'use client'

import { Task } from '@/lib/types'
import { TaskItem } from './task-item'
import { motion } from 'framer-motion'
import { AlertCircle, Calendar, Users, Trash2, Plus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EisenhowerMatrixProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  selectedTaskId: string | null
  activeTrackedTaskId: string | null
  toggleTimeTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
  currentSessionElapsed: number
  onUpdateTask?: (id: string, data: Record<string, unknown>) => Promise<unknown>
}

export function EisenhowerMatrix({
  tasks,
  onToggle,
  onSelect,
  selectedTaskId,
  activeTrackedTaskId,
  toggleTimeTracking,
  formatTime,
  currentSessionElapsed,
  onUpdateTask,
}: EisenhowerMatrixProps) {

  // Helper to determine if a date is urgent (overdue, today, or tomorrow)
  const isUrgent = (dateStr: string | null) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)
    
    return d.getTime() <= tomorrow.getTime()
  }

  // Filter quadrants
  const q1 = tasks.filter(t => (t.priority === 'high' || t.priority === 'medium') && isUrgent(t.date))
  const q2 = tasks.filter(t => (t.priority === 'high' || t.priority === 'medium') && !isUrgent(t.date))
  const q3 = tasks.filter(t => (t.priority === 'low' || t.priority === 'none') && isUrgent(t.date))
  const q4 = tasks.filter(t => (t.priority === 'low' || t.priority === 'none') && !isUrgent(t.date))

  // Trigger add-task dialog with default priority/date details
  const triggerQuickAdd = (quadrant: 1 | 2 | 3 | 4) => {
    let priority = 'none'
    let date = null

    if (quadrant === 1) {
      priority = 'high'
      date = new Date().toISOString()
    } else if (quadrant === 2) {
      priority = 'medium'
      // default to 3 days in the future
      const future = new Date()
      future.setDate(future.getDate() + 3)
      date = future.toISOString()
    } else if (quadrant === 3) {
      priority = 'low'
      date = new Date().toISOString()
    } else if (quadrant === 4) {
      priority = 'none'
    }

    const event = new CustomEvent('add-task', {
      detail: { priority, date }
    })
    window.dispatchEvent(event)
  }

  const quadrantsConfig = [
    {
      id: 1 as const,
      title: 'Do First',
      description: 'Urgent & Important',
      tasks: q1,
      colorClass: 'border-red-500/20 bg-red-500/[0.02] dark:bg-red-500/[0.01]',
      hoverColorClass: 'hover:border-red-500/40',
      badgeClass: 'bg-red-500/10 text-red-500',
      accentColor: 'text-red-500',
      icon: AlertCircle,
    },
    {
      id: 2 as const,
      title: 'Schedule',
      description: 'Important & Not Urgent',
      tasks: q2,
      colorClass: 'border-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]',
      hoverColorClass: 'hover:border-amber-500/40',
      badgeClass: 'bg-amber-500/10 text-amber-500',
      accentColor: 'text-amber-500',
      icon: Calendar,
    },
    {
      id: 3 as const,
      title: 'Delegate',
      description: 'Urgent & Not Important',
      tasks: q3,
      colorClass: 'border-blue-500/20 bg-blue-500/[0.02] dark:bg-blue-500/[0.01]',
      hoverColorClass: 'hover:border-blue-500/40',
      badgeClass: 'bg-blue-500/10 text-blue-500',
      accentColor: 'text-blue-500',
      icon: Users,
    },
    {
      id: 4 as const,
      title: 'Eliminate',
      description: 'Not Urgent & Not Important',
      tasks: q4,
      colorClass: 'border-slate-500/20 bg-slate-500/[0.02] dark:bg-slate-500/[0.01]',
      hoverColorClass: 'hover:border-slate-500/40',
      badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
      accentColor: 'text-slate-500',
      icon: Trash2,
    },
  ]

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-background">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        {quadrantsConfig.map((q) => {
          const Icon = q.icon
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "rounded-2xl border flex flex-col min-h-0 overflow-hidden transition-all duration-300 backdrop-blur-sm",
                q.colorClass,
                q.hoverColorClass
              )}
            >
              {/* Quadrant Header */}
              <div className="p-4 flex items-center justify-between border-b border-border/40 bg-card/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1.5 rounded-lg bg-background border border-border/50", q.accentColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate flex items-center gap-1.5">
                      {q.title}
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", q.badgeClass)}>
                        {q.tasks.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate">{q.description}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => triggerQuickAdd(q.id)}
                  className="p-1 rounded-lg hover:bg-secondary/65 border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                  title={`Add Task to ${q.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {q.tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 py-8">
                    <p className="text-xs text-muted-foreground/60 font-medium">No tasks in this quadrant</p>
                    <button
                      onClick={() => triggerQuickAdd(q.id)}
                      className="text-[10px] font-semibold text-primary hover:underline mt-1 flex items-center gap-0.5"
                    >
                      Create one <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  q.tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onSelect={onSelect}
                      isSelected={selectedTaskId === task.id}
                      isMultiSelected={false}
                      activeTrackedTaskId={activeTrackedTaskId}
                      toggleTimeTracking={toggleTimeTracking}
                      formatTime={formatTime}
                      currentSessionElapsed={currentSessionElapsed}
                      onUpdateTask={onUpdateTask}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
