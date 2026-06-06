'use client'

import { useState, useEffect } from 'react'
import { Task, TaskChange } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import {
  X,
  Trash2,
  Clock,
  Calendar,
  Flag,
  Tag,
  ListChecks,
  Bell,
  Repeat,
  Paperclip,
  History,
  Pencil,
  Copy,
  Clipboard,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  onDuplicate?: () => void
  onUpdate?: (id: string, data: Record<string, unknown>) => Promise<unknown>
  onRestore?: () => void
  onPurge?: () => void
}

export function TaskDetail({ task, onClose, onDelete, onEdit, onDuplicate, onUpdate, onRestore, onPurge }: TaskDetailProps) {
  const [changes, setChanges] = useState<TaskChange[]>([])
  const [loadingChanges, setLoadingChanges] = useState(false)
  const [newSubTaskName, setNewSubTaskName] = useState('')

  const handleCopyName = () => {
    navigator.clipboard.writeText(task.name)
    toast.success('Task name copied to clipboard')
  }

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubTaskName.trim() || !onUpdate) return

    const newSubTask = {
      id: crypto.randomUUID(),
      taskId: task.id,
      name: newSubTaskName.trim(),
      completed: false,
      order: task.subTasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await onUpdate(task.id, {
      subTasks: [...task.subTasks, newSubTask],
    })
    setNewSubTaskName('')
  }

  const handleToggleSubTask = async (subTaskId: string) => {
    if (!onUpdate) return
    const updatedSubTasks = task.subTasks.map(st =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    )
    await onUpdate(task.id, { subTasks: updatedSubTasks })
  }

  useEffect(() => {
    const fetchChanges = async () => {
      setLoadingChanges(true)
      try {
        const res = await fetch(`/api/tasks/${task.id}/changes`)
        if (res.ok) {
          const data = await res.json()
          setChanges(data)
        }
      } catch (err) {
        console.error('Failed to fetch changes:', err)
      } finally {
        setLoadingChanges(false)
      }
    }
    fetchChanges()
  }, [task.id])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return format(new Date(dateStr), 'PPP')
  }

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'PPp')
  }

  const completedSubtasks = task.subTasks.filter(st => st.completed).length

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-medium text-muted-foreground">Task Details</h2>
        <div className="flex items-center gap-1">
          {task.deletedAt ? (
            <>
              <Button variant="ghost" size="icon" onClick={onRestore} className="text-indigo-400 hover:text-indigo-300 h-8 w-8" title="Restore task">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onPurge} className="text-red-400 hover:text-red-300 h-8 w-8" title="Permanently delete task">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={handleCopyName} className="text-muted-foreground hover:text-foreground h-8 w-8" title="Copy task name">
                <Clipboard className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDuplicate} className="text-muted-foreground hover:text-foreground h-8 w-8" title="Duplicate task">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 w-8" aria-label="Edit task">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-red-400 h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="bg-secondary/80 border border-border/20">
            <TabsTrigger value="details" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Details</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{task.name}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                )}
              </div>

              <Separator className="bg-border/60" />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Date</p>
                    <p className="text-foreground/90 font-medium">{formatDate(task.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Deadline</p>
                    <p className="text-foreground/90 font-medium">{formatDate(task.deadline)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Estimate</p>
                    <p className="text-foreground/90 font-medium">{task.estimate || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Actual</p>
                    <p className="text-foreground/90 font-medium">{task.actualTime || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Priority</p>
                    <p className="text-foreground/90 font-medium capitalize">{task.priority}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Repeat className="w-4 h-4 text-muted-foreground/60" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Recurring</p>
                    <p className="text-foreground/90 font-medium capitalize">{task.recurringRule?.pattern || 'None'}</p>
                  </div>
                </div>
              </div>

              {task.labels.length > 0 && (
                <>
                  <Separator className="bg-border/60" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1 font-medium">
                      <Tag className="w-3 h-3" /> Labels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map(label => (
                        <Badge
                          key={label.id}
                          variant="secondary"
                          className="text-xs font-medium"
                          style={{ backgroundColor: `${label.color}20`, color: label.color }}
                        >
                          {label.icon} {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <>
                <Separator className="bg-border/60" />
                <div>
                  <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1 font-medium">
                    <ListChecks className="w-3 h-3" /> Subtasks ({completedSubtasks}/{task.subTasks.length})
                  </p>
                  
                  {task.subTasks.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {task.subTasks.map(subTask => (
                        <button
                          key={subTask.id}
                          onClick={() => handleToggleSubTask(subTask.id)}
                          className="flex items-center gap-2.5 text-sm hover:opacity-85 text-left w-full transition-opacity py-0.5 cursor-pointer"
                        >
                          <Checkbox
                            checked={subTask.completed}
                            className="border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className={subTask.completed ? 'text-muted-foreground line-through decoration-muted-foreground/75' : 'text-foreground/95 font-medium'}>
                            {subTask.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {onUpdate && (
                    <form onSubmit={handleAddSubTask} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newSubTaskName}
                        onChange={e => setNewSubTaskName(e.target.value)}
                        placeholder="Add a subtask..."
                        className="flex-1 bg-secondary/40 border border-border/50 text-xs rounded-lg px-2.5 py-1 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <Button
                        type="submit"
                        disabled={!newSubTaskName.trim()}
                        className="h-7 px-2.5 text-xs bg-secondary text-foreground hover:bg-secondary/80 border border-border/40"
                      >
                        Add
                      </Button>
                    </form>
                  )}
                </div>
              </>

              {task.reminders.length > 0 && (
                <>
                  <Separator className="bg-border/60" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1 font-medium">
                      <Bell className="w-3 h-3" /> Reminders
                    </p>
                    <div className="space-y-1.5">
                      {task.reminders.map(reminder => (
                        <div key={reminder.id} className="text-sm text-foreground/90">
                          {reminder.type} at {formatDateTime(reminder.time)}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {task.attachments.length > 0 && (
                <>
                  <Separator className="bg-border/60" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1 font-medium">
                      <Paperclip className="w-3 h-3" /> Attachments
                    </p>
                    <div className="space-y-1.5">
                      {task.attachments.map(attachment => (
                        <div key={attachment.id} className="text-sm text-foreground/90">
                          {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-border/60" />
              <div className="text-xs text-muted-foreground/75 space-y-1">
                <p>Created: {formatDateTime(task.createdAt)}</p>
                <p>Updated: {formatDateTime(task.updatedAt)}</p>
                {task.completedAt && <p>Completed: {formatDateTime(task.completedAt)}</p>}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="p-4">
              {loadingChanges ? (
                <p className="text-muted-foreground text-sm">Loading history...</p>
              ) : changes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">No changes recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {changes.map(change => (
                    <div key={change.id} className="text-sm border-b border-border/20 pb-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground font-semibold capitalize text-xs">{change.field}</span>
                        <span className="text-muted-foreground/60 text-[10px]">{formatDateTime(change.changedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {change.oldValue && (
                          <span className="text-red-500 dark:text-red-400 line-through text-[11px] bg-red-500/10 px-1.5 py-0.5 rounded">
                            {change.oldValue}
                          </span>
                        )}
                        {change.newValue && (
                          <span className="text-green-500 dark:text-green-400 text-[11px] bg-green-500/10 px-1.5 py-0.5 rounded font-medium">
                            {change.newValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

