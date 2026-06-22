'use client'

import { Label as UILabel } from '@/components/ui/label'
import { Link2, X } from 'lucide-react'
import { Task } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DependenciesSectionProps {
  allTasks: Task[]
  currentTaskId?: string | null
  selectedDependencies: string[]
  onToggle: (taskId: string) => void
}

export function DependenciesSection({ allTasks, currentTaskId, selectedDependencies, onToggle }: DependenciesSectionProps) {
  const eligibleTasks = allTasks.filter(t => t.id !== currentTaskId && !t.deletedAt)

  const selectedTasks = eligibleTasks.filter(t => selectedDependencies.includes(t.id))
  const unselectedTasks = eligibleTasks.filter(t => !selectedDependencies.includes(t.id))

  return (
    <div>
      <UILabel className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Link2 className="w-4 h-4 text-amber-500" />
        Dependencies (Blocked By)
      </UILabel>
      
      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {selectedTasks.map(task => (
            <Badge
              key={task.id}
              variant="secondary"
              className="text-xs font-medium flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 py-1 px-2.5 rounded-full"
            >
              <span className="truncate max-w-[200px]">{task.name}</span>
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className="hover:bg-amber-500/20 rounded-full p-0.5 text-amber-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {unselectedTasks.length > 0 ? (
        <div className="mt-2">
          <Select onValueChange={(val) => onToggle(val)} value="">
            <SelectTrigger className="w-full bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60 text-sm h-9">
              <SelectValue placeholder="Add task dependency..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60 text-foreground">
              {unselectedTasks.map(task => (
                <SelectItem key={task.id} value={task.id} className="text-sm">
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/75 mt-1.5">No other tasks available to set as dependencies.</p>
      )}
    </div>
  )
}
