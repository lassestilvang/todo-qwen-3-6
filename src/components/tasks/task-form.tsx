'use client'

import { useState } from 'react'
import { Task, Priority, Label, RecurringRule, RecurringPattern } from '@/lib/types'
import { parseNaturalLanguage } from '@/lib/natural-language'
import { timeRegex } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label as UILabel } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import { SubTasksSection } from './subtasks-section'
import { RemindersSection } from './reminders-section'
import { LabelsSection } from './labels-section'
import { RecurringSection } from './recurring-section'

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

interface TaskFormProps {
  task?: Task | null
  lists: { id: string; name: string; emoji: string }[]
  labels: Label[]
  onSave: (data: Record<string, unknown>) => void
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
  const [parsedPreview, setParsedPreview] = useState<{ 
    date?: Date; 
    time?: string; 
    priority?: Priority;
    labels?: string[];
    listName?: string | null;
  } | null>(null)

  const handleNameChange = (newName: string) => {
    setName(newName)
    if (task || !newName.trim()) {
      setParsedPreview(null)
      return
    }
    const parsed = parseNaturalLanguage(newName)
    if (parsed.date || parsed.time || parsed.priority !== 'none' || parsed.labels.length > 0 || parsed.listName) {
      setParsedPreview({
        date: parsed.date ?? undefined,
        time: parsed.time ?? undefined,
        priority: parsed.priority as Priority,
        labels: parsed.labels,
        listName: parsed.listName,
      })
    } else {
      setParsedPreview(null)
    }
  }

  const applyParsedFields = () => {
    if (!parsedPreview) return
    
    if (parsedPreview.date) setDate(parsedPreview.date)
    if (parsedPreview.priority && parsedPreview.priority !== 'none') setPriority(parsedPreview.priority)
    
    if (parsedPreview.labels && parsedPreview.labels.length > 0) {
      const foundLabelIds = labels
        .filter(l => parsedPreview.labels?.some(pl => pl.toLowerCase() === l.name.toLowerCase()))
        .map(l => l.id)
      
      if (foundLabelIds.length > 0) {
        setSelectedLabels(prev => {
          const combined = [...new Set([...prev, ...foundLabelIds])]
          return combined
        })
      }
    }

    if (parsedPreview.listName) {
      const foundList = lists.find(l => l.name.toLowerCase() === parsedPreview.listName?.toLowerCase())
      if (foundList) setListId(foundList.id)
    }

    const parsed = parseNaturalLanguage(name)
    setName(parsed.name)
    setParsedPreview(null)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Task name is required'
    if (name.length > 500) newErrors.name = 'Name must be less than 500 characters'
    if (estimate && !timeRegex.test(estimate)) {
      newErrors.estimate = 'Invalid format (HH:mm)'
    }
    if (actualTime && !timeRegex.test(actualTime)) {
      newErrors.actualTime = 'Invalid format (HH:mm)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const validSubTasks = subTasks.filter(st => st.name.trim().length > 0)
    const validReminders = reminders.filter(r => r.time && !isNaN(new Date(r.time).getTime()))

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
      subTasks: validSubTasks,
      reminders: validReminders,
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <UILabel htmlFor="task-name" className="text-sm font-medium text-muted-foreground">
              Task Name <span className="text-red-400">*</span>
            </UILabel>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="task-name"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="What needs to be done? (e.g., Meeting tomorrow at 3pm !high)"
                className={cn(
                  'flex-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60',
                  errors.name && 'border-red-500'
                )}
                autoFocus
              />
              {parsedPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyParsedFields}
                  className="border-border text-muted-foreground hover:text-foreground shrink-0 h-9"
                  title="Apply parsed date and priority"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  Apply
                </Button>
              )}
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            {parsedPreview && (
              <p className="text-muted-foreground text-xs mt-1 font-medium">
                Detected:{' '}
                {parsedPreview.date && `Date: ${format(parsedPreview.date, 'PPP')}`}
                {parsedPreview.date && (parsedPreview.priority !== 'none' || (parsedPreview.labels?.length ?? 0) > 0 || parsedPreview.listName) && ', '}
                {parsedPreview.priority && parsedPreview.priority !== 'none' && `Priority: ${parsedPreview.priority}`}
                {parsedPreview.priority !== 'none' && ((parsedPreview.labels?.length ?? 0) > 0 || parsedPreview.listName) && ', '}
                {parsedPreview.labels && parsedPreview.labels.length > 0 && `Labels: ${parsedPreview.labels.join(', ')}`}
                {parsedPreview.labels && parsedPreview.labels.length > 0 && parsedPreview.listName && ', '}
                {parsedPreview.listName && `List: ${parsedPreview.listName}`}
                <button type="button" onClick={applyParsedFields} className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1">
                  (click Apply to fill in)
                </button>
              </p>
            )}
          </div>

          <div>
            <UILabel htmlFor="task-description" className="text-sm font-medium text-muted-foreground">
              Description
            </UILabel>
            <Textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details..."
              className="mt-1.5 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60 min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel className="text-sm font-medium text-muted-foreground">List</UILabel>
              <Select value={listId} onValueChange={(v) => setListId(v || '')}>
                <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {lists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.emoji} {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <UILabel className="text-sm font-medium text-muted-foreground">Priority</UILabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low"><span className="text-blue-400 font-medium">Low</span></SelectItem>
                  <SelectItem value="medium"><span className="text-amber-400 font-medium">Medium</span></SelectItem>
                  <SelectItem value="high"><span className="text-red-400 font-medium">High</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel className="text-sm font-medium text-muted-foreground">Date</UILabel>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full mt-1.5 inline-flex items-center justify-start gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground transition-colors',
                    !date && 'text-muted-foreground/60'
                  )}
                >
                  <CalendarIcon className="w-4 h-4 text-muted-foreground/60" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="bg-card text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <UILabel className="text-sm font-medium text-muted-foreground">Deadline</UILabel>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full mt-1.5 inline-flex items-center justify-start gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground transition-colors',
                    !deadline && 'text-muted-foreground/60'
                  )}
                >
                  <CalendarIcon className="w-4 h-4 text-muted-foreground/60" />
                  {deadline ? format(deadline, 'PPP') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    className="bg-card text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel htmlFor="estimate" className="text-sm font-medium text-muted-foreground">
                Estimate (HH:mm)
              </UILabel>
              <Input
                id="estimate"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="01:30"
                className={cn(
                  'mt-1.5 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60',
                  errors.estimate && 'border-red-500'
                )}
              />
              {errors.estimate && <p className="text-red-400 text-xs mt-1">{errors.estimate}</p>}
            </div>

            <div>
              <UILabel htmlFor="actual-time" className="text-sm font-medium text-muted-foreground">
                Actual Time (HH:mm)
              </UILabel>
              <Input
                id="actual-time"
                value={actualTime}
                onChange={e => setActualTime(e.target.value)}
                placeholder="01:00"
                className={cn(
                  'mt-1.5 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/60',
                  errors.actualTime && 'border-red-500'
                )}
              />
              {errors.actualTime && <p className="text-red-400 text-xs mt-1">{errors.actualTime}</p>}
            </div>
          </div>

          <Separator className="bg-border/60" />

          <LabelsSection labels={labels} selectedLabels={selectedLabels} onToggle={toggleLabel} />

          <Separator className="bg-border/60" />

          <SubTasksSection
            subTasks={subTasks}
            onAdd={addSubTask}
            onUpdate={updateSubTask}
            onRemove={removeSubTask}
          />

          <Separator className="bg-border/60" />

          <RemindersSection
            reminders={reminders}
            onAdd={addReminder}
            onUpdate={updateReminder}
            onRemove={removeReminder}
          />

          <Separator className="bg-border/60" />

          <RecurringSection recurringRule={recurringRule} onChange={setRecurringRule} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border text-muted-foreground hover:text-foreground">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:opacity-90 shadow-sm font-semibold">
          {task ? 'Update' : 'Create'} Task
        </Button>
      </div>
    </form>

  )
}
