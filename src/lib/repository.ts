import { getDb } from './db'
import { Task, TaskList, Label, SubTask, Reminder, Attachment, TaskChange, Priority, RecurringRule } from './types'
import { v4 as uuidv4 } from 'uuid'

interface TaskRow {
  id: string
  name: string
  description: string | null
  list_id: string | null
  date: string | null
  deadline: string | null
  estimate: string | null
  actual_time: string | null
  priority: string
  completed: number
  completed_at: string | null
  recurring_rule: string | null
  created_at: string
  updated_at: string
  list_name?: string
  list_color?: string
  list_emoji?: string
}

interface LabelRow {
  task_id: string
  id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

interface SubTaskRow {
  id: string
  task_id: string
  name: string
  completed: number
  order: number
  created_at: string
  updated_at: string
}

interface ReminderRow {
  task_id: string
  id: string
  type: 'notification' | 'email'
  time: string
  created_at: string
}

interface AttachmentRow {
  task_id: string
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  created_at: string
}

interface TaskChangeRow {
  id: string
  task_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

interface CountRow {
  count: number
}

interface MaxOrderRow {
  maxOrder: number | null
}

interface ListRow {
  id: string
  name: string
  color: string
  emoji: string
  is_default: number
  order: number
  created_at: string
  updated_at: string
}

interface LabelDbRow {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export const taskRepository = {
  findAll(view: string, listId: string | null, showCompleted: boolean, labelId: string | null = null, showOverdue: boolean = false): Task[] {
    const db = getDb()
    let query = `
      SELECT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
    `
    const conditions: string[] = []
    const params: (string | number | null)[] = []

    if (listId) {
      conditions.push('t.list_id = ?')
      params.push(listId)
    }

    if (labelId) {
      conditions.push('t.id IN (SELECT task_id FROM task_labels WHERE label_id = ?)')
      params.push(labelId)
    }

    if (view === 'trash') {
      conditions.push('t.deleted_at IS NOT NULL')
    } else {
      conditions.push('t.deleted_at IS NULL')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    const todayDateStr = todayStr.split('T')[0]

    if (showOverdue) {
      conditions.push('date(t.date) < date(?) AND t.completed = 0')
      params.push(todayDateStr)
    }

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString()

    switch (view) {
      case 'today':
        conditions.push(`date(t.date) = date(?)`)
        params.push(todayStr)
        break
      case 'week':
        conditions.push(`t.date >= ? AND t.date <= ?`)
        params.push(todayStr, weekEndStr)
        break
      case 'upcoming':
        conditions.push(`t.date >= ?`)
        params.push(todayStr)
        break
      case 'all':
        break
    }

    if (!showCompleted) {
      conditions.push('t.completed = 0')
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += `
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        t.date ASC,
        t.created_at DESC
    `

    const rows = db.prepare(query).all(...params) as TaskRow[]
    if (rows.length === 0) return []

    const taskIds = rows.map(r => r.id)
    const placeholders = taskIds.map(() => '?').join(', ')

    return batchLoadTaskRelations(db, rows, taskIds, placeholders)
  },

  findById(id: string): Task | null {
    const db = getDb()
    const row = db.prepare(`
      SELECT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      WHERE t.id = ?
    `).get(id) as TaskRow | undefined

    if (!row) return null

    const labels = db.prepare(`
      SELECT lb.* FROM labels lb
      INNER JOIN task_labels tl ON lb.id = tl.label_id
      WHERE tl.task_id = ?
    `).all(row.id) as LabelRow[]

    const subTasksRows = db.prepare(`
      SELECT * FROM subtasks WHERE task_id = ? ORDER BY "order" ASC
    `).all(row.id) as SubTaskRow[]

    const reminders = db.prepare(`
      SELECT * FROM reminders WHERE task_id = ?
    `).all(row.id) as ReminderRow[]

    const attachments = db.prepare(`
      SELECT * FROM attachments WHERE task_id = ?
    `).all(row.id) as AttachmentRow[]

    const labelsByTask = new Map<string, Label[]>()
    const labelsArr: Label[] = labels.map(lr => {
      const label = {
        id: lr.id,
        name: lr.name,
        color: lr.color,
        icon: lr.icon,
        createdAt: lr.created_at,
        updatedAt: lr.updated_at,
      }
      return label
    })
    labelsByTask.set(row.id, labelsArr)

    const subTasksByTask = new Map<string, SubTask[]>()
    const subTasksArr: SubTask[] = subTasksRows.map(st => ({
      id: st.id,
      taskId: st.task_id,
      name: st.name,
      completed: st.completed === 1,
      order: st.order,
      createdAt: st.created_at,
      updatedAt: st.updated_at,
    }))
    subTasksByTask.set(row.id, subTasksArr)

    const remindersByTask = new Map<string, Reminder[]>()
    const remindersArr: Reminder[] = reminders.map(r => ({
      id: r.id,
      taskId: r.task_id,
      type: r.type,
      time: r.time,
      createdAt: r.created_at,
    }))
    remindersByTask.set(row.id, remindersArr)

    const attachmentsByTask = new Map<string, Attachment[]>()
    const attachmentsArr: Attachment[] = attachments.map(a => ({
      id: a.id,
      taskId: a.task_id,
      name: a.name,
      url: a.url,
      size: a.size,
      mimeType: a.mimeType,
      createdAt: a.created_at,
    }))
    attachmentsByTask.set(row.id, attachmentsArr)

    return mapTaskRowWithRelations(row, labelsByTask, subTasksByTask, remindersByTask, attachmentsByTask)
  },

  search(query: string): Task[] {
    const db = getDb()

    const ftsRows = db.prepare(`
      SELECT DISTINCT t.id
      FROM tasks_fts f
      JOIN tasks t ON t.rowid = f.rowid
      WHERE tasks_fts MATCH ? AND t.deleted_at IS NULL
      ORDER BY rank
      LIMIT 50
    `).all(query) as { id: string }[]

    if (ftsRows.length === 0) {
      const escapedQuery = query.replace(/([%_])/g, '\\$1')
      const searchQuery = `%${escapedQuery}%`
      const fallbackRows = db.prepare(`
        SELECT DISTINCT t.*
        FROM tasks t
        WHERE (t.name LIKE ? ESCAPE '\\'
            OR t.description LIKE ? ESCAPE '\\')
            AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 50

      `).all(searchQuery, searchQuery) as TaskRow[]

      if (fallbackRows.length === 0) return []

      const taskIds = fallbackRows.map(r => r.id)
      const placeholders = taskIds.map(() => '?').join(', ')
      return batchLoadTaskRelations(db, fallbackRows, taskIds, placeholders)
    }

    const taskIds = ftsRows.map(r => r.id)
    const placeholders = taskIds.map(() => '?').join(', ')

    const rows = db.prepare(`
      SELECT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      WHERE t.id IN (${placeholders})
      ORDER BY t.created_at DESC
    `).all(...taskIds) as TaskRow[]

    return batchLoadTaskRelations(db, rows, taskIds, placeholders)
  },

  create(data: {
    name: string
    description?: string
    listId?: string | null
    date?: string | null
    deadline?: string | null
    estimate?: string | null
    actualTime?: string | null
    priority?: Priority
    recurringRule?: RecurringRule | null
  }): Task {
    const db = getDb()
    const id = uuidv4()
    const recurringRuleJson = data.recurringRule ? JSON.stringify(data.recurringRule) : null

    db.prepare(`
      INSERT INTO tasks (id, name, description, list_id, date, deadline, estimate, actual_time, priority, recurring_rule)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.description || '',
      data.listId || null,
      data.date || null,
      data.deadline || null,
      data.estimate || null,
      data.actualTime || null,
      data.priority || 'none',
      recurringRuleJson
    )

    return this.findById(id)!
  },

  update(id: string, data: Partial<{
    name: string
    description: string
    listId: string | null
    date: string | null
    deadline: string | null
    estimate: string | null
    actualTime: string | null
    priority: Priority
    completed: boolean
    recurringRule: RecurringRule | null
  }>): Task | null {
    const db = getDb()
    const existing = this.findById(id)
    if (!existing) return null

    const fields: string[] = []
    const params: (string | number | boolean | null)[] = []

    const fieldMappings: Record<string, { key: string; transform?: (v: unknown) => unknown }> = {
      name: { key: 'name' },
      description: { key: 'description' },
      listId: { key: 'list_id' },
      date: { key: 'date' },
      deadline: { key: 'deadline' },
      estimate: { key: 'estimate' },
      actualTime: { key: 'actual_time' },
      priority: { key: 'priority' },
      completed: { key: 'completed', transform: (v: unknown) => (v as boolean) ? 1 : 0 },
      recurringRule: { key: 'recurring_rule', transform: (v: unknown) => v ? JSON.stringify(v) : null },
    }

    for (const [inputKey, mapping] of Object.entries(fieldMappings)) {
      if (inputKey in data) {
        const value = mapping.transform ? mapping.transform(data[inputKey as keyof typeof data]) : data[inputKey as keyof typeof data]
        fields.push(`${mapping.key} = ?`)
        params.push(value as string | number | boolean | null)

        if (existing) {
          const oldValue = inputKey === 'listId'
            ? existing.listId
            : inputKey === 'recurringRule'
              ? (existing.recurringRule ? JSON.stringify(existing.recurringRule) : null)
              : existing[inputKey as keyof Task]

          const newValue = value
          if (oldValue !== newValue) {
            this.logChange(id, inputKey, String(oldValue ?? ''), String(newValue ?? ''))
          }
        }
      }
    }

    if (data.completed === true && !existing.completed) {
      fields.push('completed_at = ?')
      params.push(new Date().toISOString())
      this.logChange(id, 'completed', 'false', 'true')
    } else if (data.completed === false && existing.completed) {
      fields.push('completed_at = NULL')
      this.logChange(id, 'completed', 'true', 'false')
    }

    if (fields.length === 0) return existing

    fields.push('updated_at = datetime(\'now\')')
    params.push(id)

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    return this.findById(id)
  },

  delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare("UPDATE tasks SET deleted_at = datetime('now') WHERE id = ?").run(id)
    return result.changes > 0
  },

  restore(id: string): boolean {
    const db = getDb()
    const result = db.prepare("UPDATE tasks SET deleted_at = NULL WHERE id = ?").run(id)
    return result.changes > 0
  },

  purge(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return result.changes > 0
  },

  setLabels(taskId: string, labelIds: string[]) {
    const db = getDb()
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(taskId)
      for (const labelId of labelIds) {
        db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId)
      }
    })
    transaction()
  },

  setSubTasks(taskId: string, subTasks: { id?: string; name: string; completed: boolean; order: number }[]) {
    const db = getDb()
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(taskId)
      for (const subTask of subTasks) {
        const id = subTask.id || uuidv4()
        db.prepare(`
          INSERT INTO subtasks (id, task_id, name, completed, "order")
          VALUES (?, ?, ?, ?, ?)
        `).run(id, taskId, subTask.name, subTask.completed ? 1 : 0, subTask.order)
      }
    })
    transaction()
  },

  setReminders(taskId: string, reminders: { id?: string; type: 'notification' | 'email'; time: string }[]) {
    const db = getDb()
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM reminders WHERE task_id = ?').run(taskId)
      for (const reminder of reminders) {
        const id = reminder.id || uuidv4()
        db.prepare(`
          INSERT INTO reminders (id, task_id, type, time)
          VALUES (?, ?, ?, ?)
        `).run(id, taskId, reminder.type, reminder.time)
      }
    })
    transaction()
  },

  logChange(taskId: string, field: string, oldValue: string | null, newValue: string | null) {
    const db = getDb()
    const id = uuidv4()
    db.prepare(`
      INSERT INTO task_changes (id, task_id, field, old_value, new_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, taskId, field, oldValue, newValue)
  },

  getChanges(taskId: string): TaskChange[] {
    const db = getDb()
    const rows = db.prepare(`
      SELECT * FROM task_changes WHERE task_id = ? ORDER BY changed_at DESC
    `).all(taskId) as TaskChangeRow[]
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      field: row.field,
      oldValue: row.old_value,
      newValue: row.new_value,
      changedAt: row.changed_at,
    }))
  },

  getOverdueCount(listId?: string): number {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]

    let query = `SELECT COUNT(*) as count FROM tasks WHERE date < ? AND completed = 0`
    const params: (string | number)[] = [today]

    if (listId) {
      query += ' AND list_id = ?'
      params.push(listId)
    }

    const result = db.prepare(query).get(...params) as CountRow
    return result.count
  },

  clearCompleted(listId: string | null): void {
    const db = getDb()
    if (listId) {
      db.prepare('DELETE FROM tasks WHERE list_id = ? AND completed = 1').run(listId)
    } else {
      db.prepare('DELETE FROM tasks WHERE completed = 1').run()
    }
  },

  purgeAllTrash(): void {
    const db = getDb()
    db.prepare("DELETE FROM tasks WHERE deleted_at IS NOT NULL").run()
  },
}

function batchLoadTaskRelations(
  db: ReturnType<typeof getDb>,
  rows: TaskRow[],
  taskIds: string[],
  placeholders: string
): Task[] {
  const labelsByTask = new Map<string, Label[]>()
  const labelsRows = db.prepare(`
    SELECT tl.task_id, lb.* FROM labels lb
    INNER JOIN task_labels tl ON lb.id = tl.label_id
    WHERE tl.task_id IN (${placeholders})
  `).all(...taskIds) as LabelRow[]
  for (const lr of labelsRows) {
    const arr = labelsByTask.get(lr.task_id) || []
    arr.push({
      id: lr.id,
      name: lr.name,
      color: lr.color,
      icon: lr.icon,
      createdAt: lr.created_at,
      updatedAt: lr.updated_at,
    })
    labelsByTask.set(lr.task_id, arr)
  }

  const subTasksByTask = new Map<string, SubTask[]>()
  const subTasksRows = db.prepare(`
    SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY "order" ASC
  `).all(...taskIds) as SubTaskRow[]
  for (const st of subTasksRows) {
    const arr = subTasksByTask.get(st.task_id) || []
    arr.push({
      id: st.id,
      taskId: st.task_id,
      name: st.name,
      completed: st.completed === 1,
      order: st.order,
      createdAt: st.created_at,
      updatedAt: st.updated_at,
    })
    subTasksByTask.set(st.task_id, arr)
  }

  const remindersByTask = new Map<string, Reminder[]>()
  const remindersRows = db.prepare(`
    SELECT * FROM reminders WHERE task_id IN (${placeholders})
  `).all(...taskIds) as ReminderRow[]
  for (const r of remindersRows) {
    const arr = remindersByTask.get(r.task_id) || []
    arr.push({
      id: r.id,
      taskId: r.task_id,
      type: r.type,
      time: r.time,
      createdAt: r.created_at,
    })
    remindersByTask.set(r.task_id, arr)
  }

  const attachmentsByTask = new Map<string, Attachment[]>()
  const attachmentsRows = db.prepare(`
    SELECT * FROM attachments WHERE task_id IN (${placeholders})
  `).all(...taskIds) as AttachmentRow[]
  for (const a of attachmentsRows) {
    const arr = attachmentsByTask.get(a.task_id) || []
    arr.push({
      id: a.id,
      taskId: a.task_id,
      name: a.name,
      url: a.url,
      size: a.size,
      mimeType: a.mimeType,
      createdAt: a.created_at,
    })
    attachmentsByTask.set(a.task_id, arr)
  }

  return rows.map(row => mapTaskRowWithRelations(row, labelsByTask, subTasksByTask, remindersByTask, attachmentsByTask))
}

function mapTaskRow(row: TaskRow, db: ReturnType<typeof getDb>): Task {
  let recurringRule: RecurringRule | null = null
  if (row.recurring_rule) {
    try {
      recurringRule = JSON.parse(row.recurring_rule)
    } catch {}
  }

  const labels = db.prepare(`
    SELECT lb.* FROM labels lb
    INNER JOIN task_labels tl ON lb.id = tl.label_id
    WHERE tl.task_id = ?
  `).all(row.id) as Label[]

  const rawSubTasks = db.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY "order" ASC
  `).all(row.id) as SubTaskRow[]
  const subTasks: SubTask[] = rawSubTasks.map(st => ({
    id: st.id,
    taskId: st.task_id,
    name: st.name,
    completed: st.completed === 1,
    order: st.order,
    createdAt: st.created_at,
    updatedAt: st.updated_at,
  }))

  const reminders = db.prepare(`
    SELECT * FROM reminders WHERE task_id = ?
  `).all(row.id) as Reminder[]

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE task_id = ?
  `).all(row.id) as Attachment[]

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    listId: row.list_id,
    date: row.date,
    deadline: row.deadline,
    estimate: row.estimate,
    actualTime: row.actual_time,
    priority: row.priority as Priority,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    recurringRule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    labels,
    subTasks,
    reminders,
    attachments,
  }
}

function mapTaskRowWithRelations(
  row: TaskRow,
  labelsByTask: Map<string, Label[]>,
  subTasksByTask: Map<string, SubTask[]>,
  remindersByTask: Map<string, Reminder[]>,
  attachmentsByTask: Map<string, Attachment[]>
): Task {
  let recurringRule: RecurringRule | null = null
  if (row.recurring_rule) {
    try {
      recurringRule = JSON.parse(row.recurring_rule)
    } catch {}
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    listId: row.list_id,
    date: row.date,
    deadline: row.deadline,
    estimate: row.estimate,
    actualTime: row.actual_time,
    priority: row.priority as Priority,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    recurringRule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    labels: labelsByTask.get(row.id) || [],
    subTasks: subTasksByTask.get(row.id) || [],
    reminders: remindersByTask.get(row.id) || [],
    attachments: attachmentsByTask.get(row.id) || [],
  }
}

export const listRepository = {
  findAll(): TaskList[] {
    const db = getDb()
    const rows = db.prepare(`SELECT * FROM lists ORDER BY "order" ASC, name ASC`).all() as ListRow[]
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      emoji: row.emoji,
      isDefault: row.is_default === 1,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  findById(id: string): TaskList | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as ListRow | undefined
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      emoji: row.emoji,
      isDefault: row.is_default === 1,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  create(data: { name: string; color?: string; emoji?: string }): TaskList {
    const db = getDb()
    const id = uuidv4()
    const maxOrder = (db.prepare('SELECT MAX("order") as maxOrder FROM lists').get() as MaxOrderRow).maxOrder ?? -1

    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, "order")
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.color || '#6366f1', data.emoji || '📋', maxOrder + 1)

    return this.findById(id)!
  },

  update(id: string, data: Partial<{ name: string; color: string; emoji: string }>): TaskList | null {
    const db = getDb()
    const fields: string[] = []
    const params: (string | number)[] = []

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color) }
    if (data.emoji !== undefined) { fields.push('emoji = ?'); params.push(data.emoji) }

    if (fields.length === 0) return this.findById(id)

    fields.push('updated_at = datetime(\'now\')')
    params.push(id)

    db.prepare(`UPDATE lists SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  },

  delete(id: string): boolean {
    const db = getDb()
    const list = this.findById(id)
    if (list?.isDefault) return false

    const result = db.prepare('DELETE FROM lists WHERE id = ? AND is_default = 0').run(id)
    return result.changes > 0
  },

  getTaskCount(listId: string): number {
    const db = getDb()
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE list_id = ? AND completed = 0
    `).get(listId) as CountRow
    return result.count
  },
}

export const labelRepository = {
  findAll(): Label[] {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as LabelDbRow[]
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  findById(id: string): Label | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as LabelDbRow | undefined
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  create(data: { name: string; color?: string; icon?: string }): Label {
    const db = getDb()
    const id = uuidv4()

    db.prepare(`
      INSERT INTO labels (id, name, color, icon)
      VALUES (?, ?, ?, ?)
    `).run(id, data.name, data.color || '#6366f1', data.icon || '🏷️')

    return this.findById(id)!
  },

  update(id: string, data: Partial<{ name: string; color: string; icon: string }>): Label | null {
    const db = getDb()
    const fields: string[] = []
    const params: string[] = []

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color) }
    if (data.icon !== undefined) { fields.push('icon = ?'); params.push(data.icon) }

    if (fields.length === 0) return this.findById(id)

    fields.push('updated_at = datetime(\'now\')')
    params.push(id)

    db.prepare(`UPDATE labels SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  },

  delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM labels WHERE id = ?').run(id)
    return result.changes > 0
  },

  getTaskCount(labelId: string): number {
    const db = getDb()
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM task_labels WHERE label_id = ?
    `).get(labelId) as CountRow
    return result.count
  },
}
