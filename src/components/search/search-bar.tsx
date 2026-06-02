'use client'

import { useRef, useEffect } from 'react'
import { useSearch, useLists } from '@/hooks/use-data'
import { useApp } from '@/hooks/use-app'
import { Input } from '@/components/ui/input'
import { Task } from '@/lib/types'
import { Search, X, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { highlightText } from '@/lib/utils'

export function SearchBar() {
  const { searchQuery, setSearchQuery, setSelectedTaskId } = useApp()
  const { results, loading } = useSearch(searchQuery)
  const { lists } = useLists()
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

  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-blue-400',
    none: 'text-muted-foreground/30',
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
          className="pl-9 pr-8 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-sm w-40 focus:w-64 sm:w-48 sm:focus:w-80 transition-all duration-300 ease-in-out shadow-inner"
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
            className="absolute top-full left-0 right-0 mt-2 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar"
          >
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No results found</div>
            ) : (
              <div className="py-2 divide-y divide-border/20">
                {results.map(task => {
                  const list = lists.find(l => l.id === task.listId)
                  return (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => handleSelect(task)}
                      className="w-full px-4 py-2.5 text-left hover:bg-secondary/70 transition-colors flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={task.completed ? "text-sm text-muted-foreground line-through truncate font-medium" : "text-sm text-foreground truncate font-medium group-hover:text-primary transition-colors"}>
                            {highlightText(task.name, searchQuery)}
                          </p>
                          {task.priority !== 'none' && (
                            <Flag className={`w-3 h-3 flex-shrink-0 ${priorityColors[task.priority]}`} />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                            {highlightText(task.description, searchQuery)}
                          </p>
                        )}
                      </div>

                      {list && (
                        <span 
                          className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-secondary/80 border border-border/40"
                          style={{ color: list.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                          {list.name}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
