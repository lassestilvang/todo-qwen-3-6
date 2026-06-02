'use client'

import { useEffect } from 'react'
import { useApp } from '@/hooks/use-app'
import { useLists } from '@/hooks/use-data'
import { SearchBar } from '@/components/search/search-bar'
import { PomodoroTimer } from '@/components/layout/pomodoro-timer'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Menu, Sun, Moon, LayoutList, LayoutGrid, Trash2, ArrowUpDown, Check, Maximize2, Minimize2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

import { Task } from '@/lib/types'

export function Header({ onAddTask, taskCount, tasks, onClearCompleted }: { onAddTask: () => void; taskCount: number; tasks: Task[]; onClearCompleted: () => void }) {
  const { 
    showCompleted, toggleShowCompleted, sidebarOpen, toggleSidebar, currentListId, currentView, viewMode, setViewMode,
    sortBy, setSortBy, sortOrder, setSortOrder, focusMode, toggleFocusMode
  } = useApp()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { lists } = useLists()

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'kanban' : 'list')
  }

  const sortOptions = [
    { id: 'date', label: 'Due Date' },
    { id: 'priority', label: 'Priority' },
    { id: 'name', label: 'Name' },
    { id: 'created', label: 'Creation Date' },
  ] as const


  const completedCount = tasks.filter(t => t.completed).length



  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const viewLabels: Record<string, string> = {
    today: 'Today',
    week: 'Next 7 Days',
    upcoming: 'Upcoming',
    all: 'All Tasks',
  }

  const currentList = lists.find(l => l.id === currentListId)
  const title = currentListId
    ? currentList?.name || 'List'
    : viewLabels[currentView] || 'Tasks'

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const completedToday = taskCount > 0 ? tasks.filter(t => t.completed && t.date && t.date.startsWith(today.toISOString().split('T')[0])).length : 0
  const totalToday = taskCount > 0 ? tasks.filter(t => t.date && t.date.startsWith(today.toISOString().split('T')[0])).length : 0
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  // Celebration for reaching daily goal
  useEffect(() => {
    if (progressPercent === 100 && totalToday > 0) {
      window.dispatchEvent(new CustomEvent('trigger-confetti'))
    }
  }, [progressPercent, totalToday])

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </motion.button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {totalToday > 0 && (
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{completedToday}/{totalToday}</span>
              </div>
            )}
          </div>
          {currentView === 'today' && (
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          )}
        </div>
        <motion.span
          key={taskCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium border border-border/40"
        >
          {taskCount}
        </motion.span>
      </div>

      <div className="flex items-center gap-3">
        <SearchBar />

        <div className="flex items-center gap-2">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={toggleShowCompleted}
          />
          <Label htmlFor="show-completed" className="text-xs text-muted-foreground hidden sm:inline">
            Completed
          </Label>
          <AnimatePresence>
            {showCompleted && completedCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onClearCompleted}
                className="text-red-400 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                title="Clear all completed tasks"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <PomodoroTimer />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleViewMode}
          className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
          title={viewMode === 'list' ? 'Switch to Kanban' : 'Switch to List'}
        >
          {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
        </motion.button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
              title="Sort tasks"
            >
              <ArrowUpDown className="w-4 h-4" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
              Sort By
            </DropdownMenuLabel>
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className="flex items-center justify-between"
              >
                {option.label}
                {sortBy === option.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
              Order
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder('asc')} className="flex items-center justify-between">
              Ascending
              {sortOrder === 'asc' && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('desc')} className="flex items-center justify-between">
              Descending
              {sortOrder === 'desc' && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <KeyboardShortcuts />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFocusMode}
          className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
          title={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddTask}
          className="bg-primary text-primary-foreground hover:opacity-90 shadow-sm h-8 px-3 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </motion.button>
      </div>
    </header>
  )
}

