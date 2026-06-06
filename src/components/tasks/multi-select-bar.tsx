'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, CheckCircle2, X, ListPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MultiSelectBarProps {
  selectedCount: number
  onDeselectAll: () => void
  onToggleComplete: () => void
  onDelete: () => void
  onMoveToList: () => void
}

export function MultiSelectBar({
  selectedCount,
  onDeselectAll,
  onToggleComplete,
  onDelete,
  onMoveToList,
}: MultiSelectBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, x: '-50%' }}
        animate={{ y: -20, x: '-50%' }}
        exit={{ y: 100, x: '-50%' }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 bg-card border border-border px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-6"
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary">{selectedCount} tasks selected</span>
          <button 
            onClick={onDeselectAll} 
            className="text-[10px] text-muted-foreground hover:text-foreground text-left"
          >
            Deselect all
          </button>
        </div>
        
        <div className="h-8 w-px bg-border/40" />
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onToggleComplete} 
            className="h-9 gap-2 text-xs font-medium px-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"
          >
            <CheckCircle2 className="w-4 h-4" />
            Toggle Complete
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDelete} 
            className="h-9 gap-2 text-xs font-medium px-3 rounded-xl hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onMoveToList}
            className="h-9 gap-2 text-xs font-medium px-3 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-500"
          >
            <ListPlus className="w-4 h-4" />
            Move to List
          </Button>
        </div>

        <button 
          onClick={onDeselectAll} 
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
