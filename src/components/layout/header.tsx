'use client'

import { useApp } from '@/hooks/use-app'
import { useLists } from '@/hooks/use-data'
import { SearchBar } from '@/components/search/search-bar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

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
          {taskCount}
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

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-white h-8 w-8">
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button onClick={onAddTask} className="bg-zinc-100 text-zinc-900 hover:bg-white h-8">
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>
    </header>
  )
}
