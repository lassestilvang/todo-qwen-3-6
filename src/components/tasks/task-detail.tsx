'use client'

import { useState, useEffect } from 'react'
import { Task, TaskChange } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
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
} from 'lucide-react'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
}

export function TaskDetail({ task, onClose, onDelete, onEdit }: TaskDetailProps) {
  const [changes, setChanges] = useState<TaskChange[]>([])
  const [loadingChanges, setLoadingChanges] = useState(false)

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
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-400">Task Details</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="text-zinc-400 hover:text-white h-8 w-8" aria-label="Edit task">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-zinc-400 hover:text-red-400 h-8 w-8">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="bg-zinc-800 border-zinc-700">
            <TabsTrigger value="details" className="data-[state=active]:bg-zinc-700">Details</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-zinc-700">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{task.name}</h3>
                {task.description && (
                  <p className="text-sm text-zinc-400 mt-2 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              <Separator className="bg-zinc-800" />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Date</p>
                    <p className="text-zinc-300">{formatDate(task.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Deadline</p>
                    <p className="text-zinc-300">{formatDate(task.deadline)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Estimate</p>
                    <p className="text-zinc-300">{task.estimate || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Actual</p>
                    <p className="text-zinc-300">{task.actualTime || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Priority</p>
                    <p className="text-zinc-300 capitalize">{task.priority}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Repeat className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Recurring</p>
                    <p className="text-zinc-300 capitalize">{task.recurringRule?.pattern || 'None'}</p>
                  </div>
                </div>
              </div>

              {task.labels.length > 0 && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div>
                    <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Labels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map(label => (
                        <Badge
                          key={label.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${label.color}20`, color: label.color }}
                        >
                          {label.icon} {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {task.subTasks.length > 0 && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div>
                    <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                      <ListChecks className="w-3 h-3" /> Subtasks ({completedSubtasks}/{task.subTasks.length})
                    </p>
                    <div className="space-y-1.5">
                      {task.subTasks.map(subTask => (
                        <div key={subTask.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-3 h-3 rounded-sm border ${subTask.completed ? 'bg-zinc-600 border-zinc-500' : 'border-zinc-600'}`} />
                          <span className={subTask.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                            {subTask.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {task.reminders.length > 0 && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div>
                    <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                      <Bell className="w-3 h-3" /> Reminders
                    </p>
                    <div className="space-y-1.5">
                      {task.reminders.map(reminder => (
                        <div key={reminder.id} className="text-sm text-zinc-300">
                          {reminder.type} at {formatDateTime(reminder.time)}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {task.attachments.length > 0 && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div>
                    <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> Attachments
                    </p>
                    <div className="space-y-1.5">
                      {task.attachments.map(attachment => (
                        <div key={attachment.id} className="text-sm text-zinc-300">
                          {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-zinc-800" />
              <div className="text-xs text-zinc-600 space-y-1">
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
                <p className="text-zinc-500 text-sm">Loading history...</p>
              ) : changes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="w-8 h-8 text-zinc-700 mb-2" />
                  <p className="text-zinc-500 text-sm">No changes recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {changes.map(change => (
                    <div key={change.id} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400 font-medium capitalize">{change.field}</span>
                        <span className="text-zinc-600 text-xs">{formatDateTime(change.changedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {change.oldValue && (
                          <span className="text-red-400 line-through text-xs bg-red-400/10 px-1.5 py-0.5 rounded">
                            {change.oldValue}
                          </span>
                        )}
                        {change.newValue && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-1.5 py-0.5 rounded">
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
