'use client'

import { useRef, useEffect } from 'react'
import { useSearch } from '@/hooks/use-data'
import { useApp } from '@/hooks/use-app'
import { Input } from '@/components/ui/input'
import { Task } from '@/lib/types'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SearchBar() {
  const { searchQuery, setSearchQuery, setSelectedTaskId } = useApp()
  const { results, loading } = useSearch(searchQuery)
  const isOpen = searchQuery.length > 0
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchQuery])

  const handleSelect = (task: Task) => {
    setSelectedTaskId(task.id)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tasks... (⌘K)"
          className="pl-9 pr-8 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-hidden"
          >
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No results found</div>
            ) : (
              <div className="py-2">
                {results.map(task => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => handleSelect(task)}
                    className="w-full px-4 py-2.5 text-left hover:bg-secondary/60 transition-colors"
                  >
                    <p className="text-sm text-foreground truncate font-medium">{task.name}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

