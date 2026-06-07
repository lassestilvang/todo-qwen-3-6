export type Priority = 'high' | 'medium' | 'low' | 'none'

export type RecurringPattern =
  | 'daily'
  | 'weekly'
  | 'weekday'
  | 'monthly'
  | 'yearly'
  | 'custom'

export interface RecurringRule {
  pattern: RecurringPattern
  interval?: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endDate?: string
}

export interface Label {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
}

export interface SubTask {
  id: string
  taskId: string
  name: string
  completed: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  taskId: string
  type: 'notification' | 'email'
  time: string
  createdAt: string
}

export interface Task {
  id: string
  name: string
  description: string
  listId: string | null
  date: string | null
  deadline: string | null
  estimate: string | null
  actualTime: string | null
  priority: Priority
  completed: boolean
  completedAt: string | null
  deletedAt?: string | null
  recurringRule: RecurringRule | null
  createdAt: string
  updatedAt: string
  labels: Label[]
  subTasks: SubTask[]
  reminders: Reminder[]
  attachments: Attachment[]
}

export interface Attachment {
  id: string
  taskId: string
  name: string
  url: string
  size: number
  mimeType: string
  createdAt: string
}

export interface TaskChange {
  id: string
  taskId: string
  field: string
  oldValue: string | null
  newValue: string | null
  changedAt: string
}

export interface TaskList {
  id: string
  name: string
  color: string
  emoji: string
  isDefault: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type ViewType = 'today' | 'week' | 'upcoming' | 'all' | 'trash'

export interface AppState {
  currentView: ViewType
  currentListId: string | null
  currentLabelId: string | null
  selectedTaskId: string | null
  showCompleted: boolean
  showOverdue: boolean
  searchQuery: string
  sidebarOpen: boolean
}
