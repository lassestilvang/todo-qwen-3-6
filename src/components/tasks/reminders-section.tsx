'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label as UILabel } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

interface ReminderForm {
  id?: string
  type: 'notification' | 'email'
  time: string
}

interface RemindersSectionProps {
  reminders: ReminderForm[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof ReminderForm, value: string) => void
  onRemove: (index: number) => void
}

export function RemindersSection({ reminders, onAdd, onUpdate, onRemove }: RemindersSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <UILabel className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Reminders
        </UILabel>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="text-muted-foreground hover:text-foreground h-7">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {reminders.map((reminder, index) => (
          <div key={reminder.id || index} className="flex items-center gap-2">
            <Select
              value={reminder.type}
              onValueChange={(v) => { if (v) onUpdate(index, 'type', v) }}
            >
              <SelectTrigger className="w-32 bg-secondary/50 border-border text-foreground text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={reminder.time ? format(new Date(reminder.time), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={e => {
                const parsed = new Date(e.target.value)
                if (!isNaN(parsed.getTime())) {
                  onUpdate(index, 'time', parsed.toISOString())
                }
              }}
              className="flex-1 bg-secondary/50 border-border text-foreground text-sm h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-8 w-8 text-muted-foreground hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

