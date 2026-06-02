'use client'

import { useState, useEffect } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Settings,
  LayoutGrid,
  LayoutList,
  Moon,
  Sun,
  Search,
  ListTodo,
} from 'lucide-react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists } from '@/hooks/use-data'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { 
    currentView, setView, toggleSidebar, toggleShowCompleted, 
    viewMode, setViewMode, setSelectedTaskId 
  } = useApp()
  const { tasks, clearCompleted } = useTasks(currentView, null, true)
  const { lists } = useLists()
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search tasks..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Tasks">
          <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('add-task')))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Task</span>
            <CommandShortcut>A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(toggleShowCompleted)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>Toggle Completed Tasks</span>
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(clearCompleted)} className="text-red-400">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear Completed Tasks</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Views">
          <CommandItem onSelect={() => runCommand(() => setView('today'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Go to Today</span>
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setView('week'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Go to Next 7 Days</span>
            <CommandShortcut>W</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setView('all'))}>
            <ListTodo className="mr-2 h-4 w-4" />
            <span>Go to All Tasks</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setViewMode(viewMode === 'list' ? 'kanban' : 'list'))}>
            {viewMode === 'list' ? <LayoutGrid className="mr-2 h-4 w-4" /> : <LayoutList className="mr-2 h-4 w-4" />}
            <span>Switch to {viewMode === 'list' ? 'Kanban' : 'List'} View</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
            {resolvedTheme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Toggle {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Recent Tasks">
          {tasks.slice(0, 5).map(task => (
            <CommandItem 
              key={task.id} 
              onSelect={() => runCommand(() => setSelectedTaskId(task.id))}
            >
              <Search className="mr-2 h-4 w-4 opacity-50" />
              <span className="truncate">{task.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Lists">
          {lists.map(list => (
            <CommandItem key={list.id} onSelect={() => runCommand(() => setView('all'))}>
              <span className="mr-2">{list.emoji}</span>
              <span>{list.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
