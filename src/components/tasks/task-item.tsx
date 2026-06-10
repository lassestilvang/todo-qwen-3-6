'use client'

import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatTimeDifference } from '@/lib/natural-language'
import { motion } from 'framer-motion'
import { highlightText } from '@/lib/utils'
import { useApp } from '@/hooks/use-app'
import {
  Flag,
  Clock,
  Calendar,
  ChevronRight,
  Paperclip,
  PlayCircle,
  PauseCircle,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/ui/markdown'
import { isBefore, startOfDay } from 'date-fns'
import { memo, useState, useRef, useEffect } from 'react'

interface TaskItemProps {
  task: Task
  onToggle: (task: Task) => void
  onSelect: (task: Task, isMultiSelect?: boolean) => void
  isSelected: boolean
  isMultiSelected?: boolean
  activeTrackedTaskId: string | null
  toggleTimeTracking: (taskId: string) => void
  formatTime: (totalSeconds: number) => string
  currentSessionElapsed: number
  onUpdateTask?: (id: string, data: Record<string, unknown>) => Promise<unknown>
}

function TaskItemComponent({ task, onToggle, onSelect, isSelected, isMultiSelected, activeTrackedTaskId, toggleTimeTracking, formatTime, currentSessionElapsed, onUpdateTask }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(task.name)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editing])

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(task.name)
    setEditing(true)
  }

  const saveEdit = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== task.name && onUpdateTask) {
      onUpdateTask(task.id, { name: trimmed })
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditName(task.name)
    setEditing(false)
  }
  const { searchQuery } = useApp()
  const isOverdue = task.date && !task.completed && isBefore(new Date(task.date), startOfDay(new Date()))
  const completedSubtasks = task.subTasks.filter(st => st.completed).length
  const totalSubtasks = task.subTasks.length

  const isTracking = activeTrackedTaskId === task.id
  const actualTimeDisplay = isTracking 
    ? formatTime(task.actualTimeSeconds + currentSessionElapsed)
    : formatTime(task.actualTimeSeconds)

  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-blue-400',
    none: 'text-zinc-500',
  }

  const priorityBorderColors = {
    high: 'border-l-red-500/80',
    medium: 'border-l-amber-500/80',
    low: 'border-l-blue-500/80',
    none: 'border-l-transparent',
  }

  const handleClick = (e: React.MouseEvent) => {
    onSelect(task, e.metaKey || e.ctrlKey || e.shiftKey)
  }

  return (
    <motion.div
      layout={isSelected}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.005, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer relative border-l-4',
        priorityBorderColors[task.priority],
        isSelected
          ? 'bg-secondary text-foreground border-border/80 shadow-md ring-1 ring-border/20'
          : isMultiSelected
            ? 'bg-primary/10 border-primary/40 shadow-sm'
            : 'bg-card/45 border-border/40 hover:bg-secondary/45 hover:border-border/60 hover:shadow-sm',
        task.priority === 'high' && !task.completed && 'shadow-[0_0_15px_-5px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]',
        task.completed && 'opacity-60 grayscale-[0.3]'
      )}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(task) } }}
      role="button"
      tabIndex={0}
    >
      {isMultiSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
      <div className="pt-0.5" onClick={e => e.stopPropagation()}>
        <motion.div
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task)}
            className={cn(
              'border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary/80',
              task.priority === 'high' && 'data-[state=checked]:bg-red-500/20 data-[state=checked]:border-red-500',
              task.priority === 'medium' && 'data-[state=checked]:bg-amber-500/20 data-[state=checked]:border-amber-500',
            )}
          />
        </motion.div>

        {!task.completed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              toggleTimeTracking(task.id)
            }}
            className={cn(
              "mt-2.5 flex items-center justify-center transition-colors",
              isTracking ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-primary"
            )}
            title={isTracking ? "Pause timer" : "Start timer"}
          >
            {isTracking ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <input
              ref={editInputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') cancelEdit()
                e.stopPropagation()
              }}
              onClick={e => e.stopPropagation()}
              className="text-sm font-medium bg-secondary/60 border border-primary/40 rounded-md px-2 py-0.5 text-foreground outline-none w-full"
            />
          ) : (
            <h3
              className={cn(
                'text-sm font-medium text-foreground leading-snug',
                task.completed && 'line-through text-muted-foreground'
              )}
              onDoubleClick={task.completed ? undefined : startEditing}
            >
              {highlightText(task.name, searchQuery)}
            </h3>
          )}
          {task.priority !== 'none' && (
            <Flag className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', priorityColors[task.priority])} />
          )}
        </div>

        {task.description && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed [&_*]:text-xs [&_*]:text-muted-foreground">
            <Markdown>{task.description}</Markdown>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.date && (
            <span className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-400 font-medium' : 'text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              {formatTimeDifference(new Date(task.date))}
              {isOverdue && <Badge variant="destructive" className="text-[10px] h-4 px-1 font-medium">Overdue</Badge>}
            </span>
          )}

          {task.estimate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.estimate}
            </span>
          )}

          {(task.actualTimeSeconds > 0 || isTracking) && (
            <span className={cn(
              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium",
              isTracking ? "bg-red-500/10 text-red-500" : "bg-indigo-500/10 text-indigo-500"
            )}>
              <Clock className="w-3 h-3" />
              {actualTimeDisplay}
            </span>
          )}

          {totalSubtasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <ChevronRight className="w-3 h-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
              <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden border border-border/20">
                <motion.div
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              {task.attachments.length}
            </span>
          )}

          {task.labels.map((label, idx) => (
            <motion.span
              key={label.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.icon} {label.name}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export const TaskItem = memo(TaskItemComponent)

