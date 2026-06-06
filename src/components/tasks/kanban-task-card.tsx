'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/lib/types'
import { TaskItem } from './task-item'

interface KanbanTaskCardProps {
  task: Task
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  isSelected: boolean
}

export function KanbanTaskCard({ task, onToggle, onSelect, isSelected }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskItem
        task={task}
        onToggle={onToggle}
        onSelect={onSelect}
        isSelected={isSelected}
      />
    </div>
  )
}
