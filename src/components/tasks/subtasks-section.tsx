'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label as UILabel } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ListChecks, Plus, X } from 'lucide-react'

interface SubTaskForm {
  id?: string
  name: string
  completed: boolean
  order: number
}

interface SubTasksSectionProps {
  subTasks: SubTaskForm[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof SubTaskForm, value: string | boolean | number) => void
  onRemove: (index: number) => void
}

export function SubTasksSection({ subTasks, onAdd, onUpdate, onRemove }: SubTasksSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <ListChecks className="w-4 h-4" />
          Subtasks
        </UILabel>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="text-zinc-400 hover:text-white h-7">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {subTasks.map((subTask, index) => (
          <div key={subTask.id || index} className="flex items-center gap-2">
            <Checkbox
              checked={subTask.completed}
              onCheckedChange={(checked) => onUpdate(index, 'completed', checked)}
              className="border-zinc-600"
            />
            <Input
              value={subTask.name}
              onChange={e => onUpdate(index, 'name', e.target.value)}
              placeholder="Subtask name"
              className="flex-1 bg-zinc-800/50 border-zinc-700 text-white text-sm h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-8 w-8 text-zinc-500 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
