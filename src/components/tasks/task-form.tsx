'use client'

import { useState } from 'react'
import { Task, Priority, Label, RecurringRule } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label as UILabel } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Tag,
  ListChecks,
  Bell,
  Repeat,
  Plus,
  X,
} from 'lucide-react'

interface SubTaskForm {
  id?: string
  name: string
  completed: boolean
  order: number
}

interface ReminderForm {
  id?: string
  type: 'notification' | 'email'
  time: string
}

interface TaskFormData {
  name: string
  description: string
  listId: string | null
  date: string | null
  deadline: string | null
  estimate: string | null
  actualTime: string | null
  priority: Priority
  labels: string[]
  subTasks: SubTaskForm[]
  reminders: ReminderForm[]
  recurringRule: RecurringRule | null
}

interface TaskFormProps {
  task?: Task | null
  lists: { id: string; name: string; emoji: string }[]
  labels: Label[]
  onSave: (data: TaskFormData) => void
  onClose: () => void
}

export function TaskForm({ task, lists, labels, onSave, onClose }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [listId, setListId] = useState(task?.listId || lists[0]?.id || '')
  const [date, setDate] = useState<Date | undefined>(task?.date ? new Date(task.date) : undefined)
  const [deadline, setDeadline] = useState<Date | undefined>(task?.deadline ? new Date(task.deadline) : undefined)
  const [estimate, setEstimate] = useState(task?.estimate || '')
  const [actualTime, setActualTime] = useState(task?.actualTime || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'none')
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels?.map(l => l.id) ?? [])
  const [subTasks, setSubTasks] = useState<SubTaskForm[]>(
    task?.subTasks?.map(st => ({ id: st.id, name: st.name, completed: st.completed, order: st.order })) ?? []
  )
  const [reminders, setReminders] = useState<ReminderForm[]>(
    task?.reminders?.map(r => ({ id: r.id, type: r.type, time: r.time })) ?? []
  )
  const [recurringRule, setRecurringRule] = useState<RecurringRule | null>(task?.recurringRule || null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Task name is required'
    if (name.length > 500) newErrors.name = 'Name must be less than 500 characters'
    if (estimate && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(estimate)) {
      newErrors.estimate = 'Invalid format (HH:mm)'
    }
    if (actualTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(actualTime)) {
      newErrors.actualTime = 'Invalid format (HH:mm)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      name: name.trim(),
      description,
      listId: listId || null,
      date: date?.toISOString() || null,
      deadline: deadline?.toISOString() || null,
      estimate: estimate || null,
      actualTime: actualTime || null,
      priority,
      labels: selectedLabels,
      subTasks,
      reminders,
      recurringRule,
    })
  }

  const addSubTask = () => {
    setSubTasks([...subTasks, { id: crypto.randomUUID(), name: '', completed: false, order: subTasks.length }])
  }

  const updateSubTask = (index: number, field: keyof SubTaskForm, value: string | boolean | number) => {
    const updated = [...subTasks]
    updated[index] = { ...updated[index], [field]: value }
    setSubTasks(updated)
  }

  const removeSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  const addReminder = () => {
    const reminderTime = new Date()
    reminderTime.setHours(reminderTime.getHours() + 1)
    setReminders([...reminders, { id: crypto.randomUUID(), type: 'notification', time: reminderTime.toISOString() }])
  }

  const updateReminder = (index: number, field: keyof ReminderForm, value: string) => {
    const updated = [...reminders]
    updated[index] = { ...updated[index], [field]: value }
    setReminders(updated)
  }

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index))
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <UILabel htmlFor="task-name" className="text-sm font-medium text-zinc-300">
              Task Name <span className="text-red-400">*</span>
            </UILabel>
            <Input
              id="task-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What needs to be done?"
              className={cn(
                'mt-1.5 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600',
                errors.name && 'border-red-500'
              )}
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <UILabel htmlFor="task-description" className="text-sm font-medium text-zinc-300">
              Description
            </UILabel>
            <Textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details..."
              className="mt-1.5 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel className="text-sm font-medium text-zinc-300">List</UILabel>
              <Select value={listId} onValueChange={(v) => setListId(v || '')}>
                <SelectTrigger className="mt-1.5 bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {lists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.emoji} {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <UILabel className="text-sm font-medium text-zinc-300">Priority</UILabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="mt-1.5 bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low"><span className="text-blue-400">Low</span></SelectItem>
                  <SelectItem value="medium"><span className="text-amber-400">Medium</span></SelectItem>
                  <SelectItem value="high"><span className="text-red-400">High</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel className="text-sm font-medium text-zinc-300">Date</UILabel>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full mt-1.5 inline-flex items-center justify-start gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white transition-colors',
                    !date && 'text-zinc-500'
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="bg-zinc-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <UILabel className="text-sm font-medium text-zinc-300">Deadline</UILabel>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full mt-1.5 inline-flex items-center justify-start gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white transition-colors',
                    !deadline && 'text-zinc-500'
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {deadline ? format(deadline, 'PPP') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    className="bg-zinc-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel htmlFor="estimate" className="text-sm font-medium text-zinc-300">
                Estimate (HH:mm)
              </UILabel>
              <Input
                id="estimate"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="01:30"
                className={cn(
                  'mt-1.5 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600',
                  errors.estimate && 'border-red-500'
                )}
              />
              {errors.estimate && <p className="text-red-400 text-xs mt-1">{errors.estimate}</p>}
            </div>

            <div>
              <UILabel htmlFor="actual-time" className="text-sm font-medium text-zinc-300">
                Actual Time (HH:mm)
              </UILabel>
              <Input
                id="actual-time"
                value={actualTime}
                onChange={e => setActualTime(e.target.value)}
                placeholder="01:00"
                className={cn(
                  'mt-1.5 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600',
                  errors.actualTime && 'border-red-500'
                )}
              />
              {errors.actualTime && <p className="text-red-400 text-xs mt-1">{errors.actualTime}</p>}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div>
            <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Labels
            </UILabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all',
                    selectedLabels.includes(label.id)
                      ? 'ring-1 ring-white/20'
                      : 'opacity-50 hover:opacity-75'
                  )}
                  style={{
                    backgroundColor: selectedLabels.includes(label.id) ? `${label.color}30` : `${label.color}15`,
                    color: label.color,
                  }}
                >
                  {label.icon} {label.name}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Subtasks
              </UILabel>
              <Button type="button" variant="ghost" size="sm" onClick={addSubTask} className="text-zinc-400 hover:text-white h-7">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {subTasks.map((subTask, index) => (
                <div key={subTask.id || index} className="flex items-center gap-2">
                  <Checkbox
                    checked={subTask.completed}
                    onCheckedChange={(checked) => updateSubTask(index, 'completed', checked)}
                    className="border-zinc-600"
                  />
                  <Input
                    value={subTask.name}
                    onChange={e => updateSubTask(index, 'name', e.target.value)}
                    placeholder="Subtask name"
                    className="flex-1 bg-zinc-800/50 border-zinc-700 text-white text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubTask(index)}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminders
              </UILabel>
              <Button type="button" variant="ghost" size="sm" onClick={addReminder} className="text-zinc-400 hover:text-white h-7">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {reminders.map((reminder, index) => (
                <div key={reminder.id || index} className="flex items-center gap-2">
                  <Select
                    value={reminder.type}
                    onValueChange={(v) => updateReminder(index, 'type', v)}
                  >
                    <SelectTrigger className="w-32 bg-zinc-800/50 border-zinc-700 text-white text-sm h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="datetime-local"
                    value={reminder.time ? format(new Date(reminder.time), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={e => {
                      const parsed = new Date(e.target.value)
                      if (!isNaN(parsed.getTime())) {
                        updateReminder(index, 'time', parsed.toISOString())
                      }
                    }}
                    className="flex-1 bg-zinc-800/50 border-zinc-700 text-white text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeReminder(index)}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div>
            <UILabel className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Recurring
            </UILabel>
            <Select
              value={recurringRule?.pattern || 'none'}
              onValueChange={(v) => {
                if (v === 'none') {
                  setRecurringRule(null)
                } else {
                  setRecurringRule({ pattern: v as any })
                }
              }}
            >
              <SelectTrigger className="mt-1.5 bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="none">No recurrence</SelectItem>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekly">Every week</SelectItem>
                <SelectItem value="weekday">Every weekday</SelectItem>
                <SelectItem value="monthly">Every month</SelectItem>
                <SelectItem value="yearly">Every year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800 flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-300">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-white">
          {task ? 'Update' : 'Create'} Task
        </Button>
      </div>
    </form>
  )
}
