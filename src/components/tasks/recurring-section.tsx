'use client'

import { Label as UILabel } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Repeat } from 'lucide-react'
import { RecurringRule, RecurringPattern } from '@/lib/types'

interface RecurringSectionProps {
  recurringRule: RecurringRule | null
  onChange: (rule: RecurringRule | null) => void
}

export function RecurringSection({ recurringRule, onChange }: RecurringSectionProps) {
  return (
    <div>
      <UILabel className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Repeat className="w-4 h-4" />
        Recurring
      </UILabel>
      <Select
        value={recurringRule?.pattern || 'none'}
        onValueChange={(v) => {
          if (v === 'none') {
            onChange(null)
          } else {
            onChange({ pattern: v as RecurringPattern })
          }
        }}
      >
        <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="none">No recurrence</SelectItem>
          <SelectItem value="daily">Every day</SelectItem>
          <SelectItem value="weekly">Every week</SelectItem>
          <SelectItem value="weekday">Every weekday</SelectItem>
          <SelectItem value="monthly">Every month</SelectItem>
          <SelectItem value="yearly">Every year</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

