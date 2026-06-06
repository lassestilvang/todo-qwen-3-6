'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SubTask } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableSubTaskItemProps {
  subTask: SubTask
  onToggle: (id: string) => void
}

export function SortableSubTaskItem({ subTask, onToggle }: SortableSubTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subTask.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 text-sm group/subtask transition-colors rounded-lg px-2 py-1",
        isDragging ? "bg-secondary shadow-sm" : "hover:bg-secondary/40"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      
      <Checkbox
        checked={subTask.completed}
        onCheckedChange={() => onToggle(subTask.id)}
        className="border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      <span 
        className={cn(
          "flex-1 transition-all duration-200",
          subTask.completed ? 'text-muted-foreground line-through decoration-muted-foreground/75' : 'text-foreground/95 font-medium'
        )}
      >
        {subTask.name}
      </span>
    </div>
  )
}
