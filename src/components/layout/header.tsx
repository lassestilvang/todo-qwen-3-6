'use client'

import { useApp } from '@/hooks/use-app'
import { useLists } from '@/hooks/use-data'
import { SearchBar } from '@/components/search/search-bar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

export function Header({ onAddTask, taskCount }: { onAddTask: () => void; taskCount: number }) {
  const { showCompleted, toggleShowCompleted, sidebarOpen, toggleSidebar, currentListId, currentView } = useApp()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { lists } = useLists()

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

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            className="text-zinc-400 hover:text-white h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </motion.button>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {currentView === 'today' && (
            <p className="text-xs text-zinc-500">{dateStr}</p>
          )}
        </div>
        <motion.span
          key={taskCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium"
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
          <Label htmlFor="show-completed" className="text-xs text-zinc-500 hidden sm:inline">
            Completed
          </Label>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="text-zinc-400 hover:text-white h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddTask}
          className="bg-zinc-100 text-zinc-900 hover:bg-white h-8 px-3 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </motion.button>
      </div>
    </header>
  )
}
