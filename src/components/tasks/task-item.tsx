'use client'

import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Flag,
  Clock,
  Calendar,
  ChevronRight,
  Paperclip,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { format, isBefore, startOfDay } from 'date-fns'

interface TaskItemProps {
  task: Task
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  isSelected: boolean
}

export function TaskItem({ task, onToggle, onSelect, isSelected }: TaskItemProps) {
  const isOverdue = task.date && !task.completed && isBefore(new Date(task.date), startOfDay(new Date()))
  const completedSubtasks = task.subTasks.filter(st => st.completed).length
  const totalSubtasks = task.subTasks.length

  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-blue-400',
    none: 'text-zinc-500',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'bg-zinc-800/80 border-zinc-700'
          : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800/50 hover:border-zinc-700/50',
        task.completed && 'opacity-60'
      )}
      onClick={() => onSelect(task)}
    >
      <div className="pt-0.5" onClick={e => e.stopPropagation()}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task)}
          className={cn(
            'border-zinc-600 data-[state=checked]:bg-zinc-700 data-[state=checked]:border-zinc-500',
            task.priority === 'high' && 'data-[state=checked]:bg-red-500/20 data-[state=checked]:border-red-500',
            task.priority === 'medium' && 'data-[state=checked]:bg-amber-500/20 data-[state=checked]:border-amber-500',
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            'text-sm font-medium text-white leading-snug',
            task.completed && 'line-through text-zinc-500'
          )}>
            {task.name}
          </h3>
          {task.priority !== 'none' && (
            <Flag className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', priorityColors[task.priority])} />
          )}
        </div>

        {task.description && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.date && (
            <span className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-400' : 'text-zinc-500'
            )}>
              <Calendar className="w-3 h-3" />
              {format(new Date(task.date), 'MMM d')}
              {isOverdue && <Badge variant="destructive" className="text-[10px] h-4 px-1">Overdue</Badge>}
            </span>
          )}

          {task.estimate && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              {task.estimate}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <ChevronRight className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Paperclip className="w-3 h-3" />
              {task.attachments.length}
            </span>
          )}

          {task.labels.map(label => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.icon} {label.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
