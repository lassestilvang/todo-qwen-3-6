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
  LayoutGrid,
  LayoutList,
  Moon,
  Sun,
  Search,
  ListTodo,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react'
import { useApp } from '@/hooks/use-app'
import { useTasks, useLists } from '@/hooks/use-data'
import { useTheme } from 'next-themes'
import { parseNaturalLanguage } from '@/lib/natural-language'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { 
    currentView, setView, toggleShowCompleted, currentListId,
    viewMode, setViewMode, setSelectedTaskId, focusMode, toggleFocusMode
  } = useApp()
  const { tasks, clearCompleted, createTask } = useTasks(currentView, null, true)
  const { lists } = useLists()
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
        setSearchValue('')
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    setSearchValue('')
    command()
  }

  const handleCreateFromSearch = async () => {
    if (!searchValue.trim()) return
    const parsed = parseNaturalLanguage(searchValue)
    const listName = parsed.listName
    const matchedList = listName
      ? lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
      : null

    await createTask({
      name: parsed.name,
      priority: parsed.priority === 'none' ? 'none' : parsed.priority,
      date: parsed.date?.toISOString() || null,
      listId: matchedList?.id || currentListId || null,
      recurringRule: parsed.recurringRule || null,
    })

    setOpen(false)
    setSearchValue('')
  }

  return (
    <CommandDialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setSearchValue('') }}>
      <CommandInput
        value={searchValue}
        onValueChange={setSearchValue}
        placeholder="Type a command, search tasks, or create one..."
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {searchValue.trim() ? (
            <CommandItem onSelect={handleCreateFromSearch} className="text-primary">
              <Zap className="mr-2 h-4 w-4" />
              <span>Create task: &ldquo;{searchValue.trim()}&rdquo;</span>
            </CommandItem>
          ) : (
            <span className="text-sm text-muted-foreground">No results found.</span>
          )}
        </CommandEmpty>
        
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
          <CommandItem onSelect={() => runCommand(toggleFocusMode)}>
            {focusMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
            <span>{focusMode ? 'Exit' : 'Enter'} Focus Mode</span>
            <CommandShortcut>F</CommandShortcut>
          </CommandItem>
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
