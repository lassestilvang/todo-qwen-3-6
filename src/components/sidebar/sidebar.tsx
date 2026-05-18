'use client'

import { useApp } from '@/hooks/use-app'
import { useLists, useLabels } from '@/hooks/use-data'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ListTodo,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const views = [
  { id: 'today' as const, label: 'Today', icon: Calendar },
  { id: 'week' as const, label: 'Next 7 Days', icon: CalendarRange },
  { id: 'upcoming' as const, label: 'Upcoming', icon: CalendarDays },
  { id: 'all' as const, label: 'All', icon: ListTodo },
]

export function Sidebar() {
  const { currentView, currentListId, currentLabelId, setView, setListId, setLabelId, sidebarOpen, toggleSidebar } = useApp()
  const { lists, createList, deleteList } = useLists()
  const { labels } = useLabels()
  const [showCreateList, setShowCreateList] = useState(false)
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState('#6366f1')
  const [newListEmoji, setNewListEmoji] = useState('📋')
  const [listsExpanded, setListsExpanded] = useState(true)
  const [labelsExpanded, setLabelsExpanded] = useState(true)

  const commonEmojis = ['📋', '💼', '🏠', '🎯', '💡', '📚', '🎨', '🏃', '💪', '🎵', '🍕', '✈️', '💰', '❤️', '⭐']
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    try {
      await createList({ name: newListName.trim(), color: newListColor, emoji: newListEmoji })
      setNewListName('')
      setNewListColor('#6366f1')
      setNewListEmoji('📋')
      setShowCreateList(false)
    } catch {
      // Error handled by toast in use-data.ts
    }
  }

  const handleDeleteList = async () => {
    if (!deleteListId) return
    try {
      await deleteList(deleteListId)
      setDeleteListId(null)
    } catch {
      // Error handled by toast in use-data.ts
    }
  }

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 z-40 overflow-hidden"
      >
        <div className="w-[280px] h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <h1 className="text-lg font-semibold text-white">Task Planner</h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-zinc-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              <nav className="space-y-1">
                {views.map(view => {
                  const Icon = view.icon
                  const isActive = currentView === view.id && !currentListId
                  return (
                    <button
                      key={view.id}
                      onClick={() => setView(view.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {view.label}
                    </button>
                  )
                })}
              </nav>

              <Separator className="my-4 bg-zinc-800" />

              <div>
                <button
                  onClick={() => setListsExpanded(!listsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  <span>Lists</span>
                  {listsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {listsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {lists.map(list => (
                          <div key={list.id} className="group flex items-center">
                            <button
                              onClick={() => setListId(list.id)}
                              className={cn(
                                'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                currentListId === list.id
                                  ? 'bg-zinc-800 text-white'
                                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                              )}
                            >
                              <span>{list.emoji}</span>
                              <span className="truncate">{list.name}</span>
                            </button>
                            {!list.isDefault && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                  <DropdownMenuItem
                                    onClick={() => setDeleteListId(list.id)}
                                    className="text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowCreateList(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors mt-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add List
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator className="my-4 bg-zinc-800" />

              <div>
                <button
                  onClick={() => setLabelsExpanded(!labelsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  <span>Labels</span>
                  {labelsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {labelsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {labels.map(label => (
                          <button
                            key={label.id}
                            onClick={() => setLabelId(currentLabelId === label.id ? null : label.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              currentLabelId === label.id
                                ? 'bg-zinc-800 text-white'
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            )}
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                            <span>{label.icon}</span>
                            <span className="truncate">{label.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>
        </div>
      </motion.aside>

      <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="List name"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Emoji</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewListEmoji(emoji)}
                    aria-label={`Select emoji: ${emoji}`}
                    aria-pressed={newListEmoji === emoji}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors',
                      newListEmoji === emoji ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewListColor(color)}
                    aria-label={`Select color: ${color}`}
                    aria-pressed={newListColor === color}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      newListColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateList(false)} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteListId} onOpenChange={(open) => !open && setDeleteListId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Are you sure you want to delete this list? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteListId(null)} className="border-zinc-700">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
