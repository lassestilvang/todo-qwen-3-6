'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, HelpCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useApp } from '@/hooks/use-app'

interface ShortcutRowProps {
  keys: string[]
  description: string
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="px-2 py-0.5 text-xs font-mono font-semibold bg-secondary border border-border/80 rounded shadow-xs text-foreground"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)
  const { setView, toggleSidebar, toggleShowCompleted, toggleShowOverdue, toggleFocusMode } = useApp()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input, textarea, or contenteditable
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return
      }

      const key = e.key.toLowerCase()

      switch (key) {
        case '?':
          e.preventDefault()
          setIsOpen((prev) => !prev)
          break
        case 'n':
        case 'a':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('add-task'))
          break
        case 't':
          e.preventDefault()
          setView('today')
          break
        case 'w':
          e.preventDefault()
          setView('week')
          break
        case 'u':
          e.preventDefault()
          setView('upcoming')
          break
        case 'l':
          e.preventDefault()
          setView('all')
          break
        case 's':
          e.preventDefault()
          toggleSidebar()
          break
        case 'c':
          e.preventDefault()
          toggleShowCompleted()
          break
        case 'o':
          e.preventDefault()
          toggleShowOverdue()
          break
        case 'f':
          e.preventDefault()
          toggleFocusMode()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView, toggleSidebar, toggleShowCompleted, toggleFocusMode])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
            aria-label="Keyboard shortcuts"
          />
        }
      >
        <Keyboard className="w-4 h-4" />
      </DialogTrigger>

      <DialogContent className="max-w-md bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General</h3>
            <ShortcutRow keys={['?']} description="Toggle shortcuts guide" />
            <ShortcutRow keys={['⌘', 'K']} description="Search tasks" />
            <ShortcutRow keys={['S']} description="Toggle sidebar" />
            <ShortcutRow keys={['F']} description="Toggle Focus Mode" />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tasks</h3>
            <ShortcutRow keys={['N', 'or', 'A']} description="Create new task" />
            <ShortcutRow keys={['C']} description="Toggle completed tasks" />
            <ShortcutRow keys={['O']} description="Toggle overdue tasks" />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Views</h3>
            <ShortcutRow keys={['T']} description="Go to Today" />
            <ShortcutRow keys={['W']} description="Go to Next 7 Days (Week)" />
            <ShortcutRow keys={['U']} description="Go to Upcoming" />
            <ShortcutRow keys={['L']} description="Go to All Tasks" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
