'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Priority } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface KanbanQuickAddProps {
  priority: Priority
  onAdd: (name: string, priority: Priority) => Promise<void>
}

export function KanbanQuickAdd({ priority, onAdd }: KanbanQuickAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) return
    await onAdd(name.trim(), priority)
    setName('')
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-start gap-2 text-muted-foreground hover:text-foreground text-xs h-8"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Task
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') setIsAdding(false)
        }}
        placeholder="New task..."
        className="bg-secondary/40 border-border/50 text-sm h-8"
        autoFocus
      />
      <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8">Cancel</Button>
    </div>
  )
}
