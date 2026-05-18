'use client'

import { Label as UILabel } from '@/components/ui/label'
import { Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/lib/types'

interface LabelsSectionProps {
  labels: Label[]
  selectedLabels: string[]
  onToggle: (labelId: string) => void
}

export function LabelsSection({ labels, selectedLabels, onToggle }: LabelsSectionProps) {
  return (
    <div>
      <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Labels
      </UILabel>
      <div className="flex flex-wrap gap-2 mt-2">
        {labels.map(label => (
          <button
            key={label.id}
            type="button"
            onClick={() => onToggle(label.id)}
            aria-pressed={selectedLabels.includes(label.id)}
            aria-label={`${selectedLabels.includes(label.id) ? 'Remove' : 'Add'} label: ${label.name}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all',
              selectedLabels.includes(label.id)
                ? 'ring-1 ring-white/20'
                : 'opacity-50 hover:opacity-75'
            )}
            style={{
              backgroundColor: selectedLabels.includes(label.id) ? `${label.color}30` : `${label.color}15`,
              color: label.color,
            }}
          >
            {label.icon} {label.name}
          </button>
        ))}
      </div>
    </div>
  )
}
