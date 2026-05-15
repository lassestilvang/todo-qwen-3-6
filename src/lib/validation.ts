import { z } from 'zod'

export const prioritySchema = z.enum(['high', 'medium', 'low', 'none'])

export const recurringPatternSchema = z.enum(['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom'])

export const recurringRuleSchema = z.object({
  pattern: recurringPatternSchema,
  interval: z.number().int().positive().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endDate: z.string().datetime().optional(),
})

export const reminderSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['notification', 'email']),
  time: z.string().datetime(),
})

export const subTaskSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Subtask name is required').max(500),
  completed: z.boolean().default(false),
  order: z.number().int().default(0),
})

export const attachmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  size: z.number().int().positive(),
  mimeType: z.string(),
})

export const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(500),
  description: z.string().max(10000).default(''),
  listId: z.string().uuid().nullable().default(null),
  date: z.string().datetime().nullable().default(null),
  deadline: z.string().datetime().nullable().default(null),
  estimate: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').nullable().default(null),
  actualTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').nullable().default(null),
  priority: prioritySchema.default('none'),
  completed: z.boolean().default(false),
  recurringRule: recurringRuleSchema.nullable().default(null),
  labels: z.array(z.string().uuid()).default([]),
  subTasks: z.array(subTaskSchema).default([]),
  reminders: z.array(reminderSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  emoji: z.string().max(2).default('📋'),
})

export const updateListSchema = createListSchema.partial()

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  icon: z.string().max(2).default('🏷️'),
})

export const updateLabelSchema = createLabelSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
