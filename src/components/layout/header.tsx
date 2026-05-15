'use client'

import { useApp } from '@/hooks/use-app'
import { useTasks } from '@/hooks/use-data'
import { SearchBar } from '@/components/search/search-bar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Menu, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header({ onAddTask }: { onAddTask: () => void }) {
  const { currentView, currentListId, showCompleted, toggleShowCompleted, sidebarOpen, toggleSidebar } = useApp()
  const { tasks } = useTasks(currentView, currentListId, showCompleted)
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle('dark', stored === 'dark')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const viewLabels: Record<string, string> = {
    today: 'Today',
    week: 'Next 7 Days',
    upcoming: 'Upcoming',
    all: 'All Tasks',
  }

  const title = currentListId
    ? `List`
    : viewLabels[currentView] || 'Tasks'

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-zinc-400 hover:text-white h-8 w-8">
            <Menu className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {currentView === 'today' && (
            <p className="text-xs text-zinc-500">{dateStr}</p>
          )}
        </div>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
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

        {mounted && (
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-white h-8 w-8">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}

        <Button onClick={onAddTask} className="bg-zinc-100 text-zinc-900 hover:bg-white h-8">
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>
    </header>
  )
}
