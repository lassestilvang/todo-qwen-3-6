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
  Settings,
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
import { ProductivityDashboard } from '@/components/sidebar/productivity-dashboard'
import { Task } from '@/lib/types'
import { sounds } from '@/lib/sounds'
import { toast } from 'sonner'
import { Download, Volume2, VolumeX } from 'lucide-react'

const views = [
  { id: 'today' as const, label: 'Today', icon: Calendar },
  { id: 'week' as const, label: 'Next 7 Days', icon: CalendarRange },
  { id: 'upcoming' as const, label: 'Upcoming', icon: CalendarDays },
  { id: 'all' as const, label: 'All', icon: ListTodo },
  { id: 'trash' as const, label: 'Trash', icon: Trash2 },
]

export function Sidebar({ tasks }: { tasks: Task[] }) {
  const { 
    currentView, currentListId, currentLabelId, setView, setListId, setLabelId, sidebarOpen, toggleSidebar,
    accentColor, setAccentColor
  } = useApp()
  const { lists, createList, deleteList } = useLists()
  const { labels } = useLabels()
  
  const getTaskCount = (view: string, listId?: string, labelId?: string) => {
    if (view === 'trash') {
      return tasks.filter(t => t.deletedAt).length
    }
    
    const activeTasks = tasks.filter(t => !t.completed && !t.deletedAt)
    if (listId) return activeTasks.filter(t => t.listId === listId).length
    if (labelId) return activeTasks.filter(t => t.labels.some(l => l.id === labelId)).length
    
    const today = new Date().toISOString().split('T')[0]
    if (view === 'today') return activeTasks.filter(t => t.date && t.date.startsWith(today)).length
    if (view === 'all') return activeTasks.length
    return 0
  }
  const [showCreateList, setShowCreateList] = useState(false)
  const [showCreateLabel, setShowCreateLabel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  
  const handleExportData = () => {
    try {
      const data = {
        tasks,
        lists,
        labels,
        exportedAt: new Date().toISOString(),
        version: '1.5.0'
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `task-planner-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    sounds.setMuted(nextMuted)
    if (!nextMuted) sounds.playClick()
  }
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState('#6366f1')
  const [newListEmoji, setNewListEmoji] = useState('📋')
  const [newLabelName, setNewLabelName] = useState('')
  const [listsExpanded, setListsExpanded] = useState(true)
  const [labelsExpanded, setLabelsExpanded] = useState(true)

  const commonEmojis = ['📋', '💼', '🏠', '🎯', '💡', '📚', '🎨', '🏃', '💪', '🎵', '🍕', '✈️', '💰', '❤️', '⭐']
  const accentColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6', '#f97316']
  const colors = accentColors

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

  const { createLabel } = useLabels()
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return
    try {
      await createLabel({ name: newLabelName.trim() })
      setNewLabelName('')
      setShowCreateLabel(false)
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
        className="fixed left-0 top-0 h-full bg-card/65 backdrop-blur-md border-r border-border z-40 overflow-hidden"
      >
        <div className="w-[280px] h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Task Planner
            </h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
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
                    <motion.button
                      key={view.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView(view.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group/item',
                        isActive
                          ? 'bg-secondary text-foreground font-medium shadow-sm border border-border/20'
                          : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        {view.label}
                      </div>
                      {getTaskCount(view.id) > 0 && (
                        <span className="text-[10px] font-bold bg-secondary/80 px-1.5 py-0.5 rounded-full border border-border/40 text-muted-foreground group-hover/item:text-foreground transition-colors">
                          {getTaskCount(view.id)}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </nav>

              <Separator className="my-4 bg-border/60" />

              <div>
                <button
                  onClick={() => setListsExpanded(!listsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
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
                        {lists.map((list, idx) => (
                          <motion.div
                            key={list.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group flex items-center"
                          >
                            <motion.button
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setListId(list.id)}
                              className={cn(
                                'flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group/item',
                                currentListId === list.id
                                  ? 'bg-secondary text-foreground font-medium shadow-sm border border-border/20'
                                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="shrink-0">{list.emoji}</span>
                                <span className="truncate">{list.name}</span>
                              </div>
                              {getTaskCount('', list.id) > 0 && (
                                <span className="text-[10px] font-bold bg-secondary/80 px-1.5 py-0.5 rounded-full border border-border/40 text-muted-foreground group-hover/item:text-foreground transition-colors shrink-0">
                                  {getTaskCount('', list.id)}
                                </span>
                              )}
                            </motion.button>
                            {!list.isDefault && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  <DropdownMenuItem
                                    onClick={() => setDeleteListId(list.id)}
                                    className="text-red-400 focus:bg-destructive/10 focus:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </motion.div>
                        ))}
                        
                        {showCreateList ? (
                          <div className="flex items-center gap-2 px-3 py-2 mt-1">
                            <Input
                              value={newListName}
                              onChange={e => setNewListName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateList()
                                if (e.key === 'Escape') setShowCreateList(false)
                              }}
                              placeholder="New list..."
                              className="bg-secondary/40 border-border/50 text-sm h-8"
                              autoFocus
                            />
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateList(false)} className="h-8">Cancel</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCreateList(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add List
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator className="my-4 bg-border/60" />

              <div>
                <button
                  onClick={() => setLabelsExpanded(!labelsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
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
                        {labels.map((label, idx) => (
                          <motion.button
                            key={label.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLabelId(currentLabelId === label.id ? null : label.id)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group/item',
                              currentLabelId === label.id
                                ? 'bg-secondary text-foreground font-medium shadow-sm border border-border/20'
                                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: label.color }}
                              />
                              <span className="shrink-0">{label.icon}</span>
                              <span className="truncate">{label.name}</span>
                            </div>
                            {getTaskCount('', undefined, label.id) > 0 && (
                              <span className="text-[10px] font-bold bg-secondary/80 px-1.5 py-0.5 rounded-full border border-border/40 text-muted-foreground group-hover/item:text-foreground transition-colors shrink-0">
                                {getTaskCount('', undefined, label.id)}
                              </span>
                            )}
                          </motion.button>
                        ))}
                        {showCreateLabel ? (
                          <div className="flex items-center gap-2 px-3 py-2 mt-1">
                            <Input
                              value={newLabelName}
                              onChange={e => setNewLabelName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateLabel()
                                if (e.key === 'Escape') setShowCreateLabel(false)
                              }}
                              placeholder="New label..."
                              className="bg-secondary/40 border-border/50 text-sm h-8"
                              autoFocus
                            />
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateLabel(false)} className="h-8">Cancel</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCreateLabel(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Label
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border/40 bg-secondary/10 flex flex-col gap-2">
            <ProductivityDashboard />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/20 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Button>
          </div>
        </div>
      </motion.aside>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accent Color</Label>
              <div className="grid grid-cols-5 gap-3">
                {accentColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={cn(
                      'w-10 h-10 rounded-xl transition-all duration-200 border-2',
                      accentColor === color ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Select a color to personalize the application interface.</p>
            </div>

            <Separator className="bg-border/40" />

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferences</Label>
              <div className="space-y-2">
                <button
                  onClick={toggleMute}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                    <span className="text-sm font-medium">Sound Effects</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{isMuted ? 'Off' : 'On'}</span>
                </button>

                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">Export Data</span>
                  </div>
                  <span className="text-xs text-muted-foreground">JSON</span>
                </button>
              </div>
            </div>

            <Separator className="bg-border/40" />
            
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</Label>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-xs font-medium">Task Planner Pro v1.5.0</p>
                <p className="text-[10px] text-muted-foreground mt-1">The most advanced daily productivity system ever created.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)} className="w-full bg-primary text-primary-foreground font-semibold">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
