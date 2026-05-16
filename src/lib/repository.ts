import { getDb } from './db'
import { Task, TaskList, Label, SubTask, Reminder, Attachment, TaskChange, Priority, RecurringRule } from './types'
import { v4 as uuidv4 } from 'uuid'

export const taskRepository = {
  findAll(view: string, listId: string | null, showCompleted: boolean): Task[] {
    const db = getDb()
    let query = `
      SELECT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
    `
    const conditions: string[] = []
    const params: any[] = []

    if (listId) {
      conditions.push('t.list_id = ?')
      params.push(listId)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

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

    const rows = db.prepare(query).all(...params) as any[]
    if (rows.length === 0) return []

    const taskIds = rows.map(r => r.id)
    const placeholders = taskIds.map(() => '?').join(', ')

    const labelsByTask = new Map<string, Label[]>()
    const labelsRows = db.prepare(`
      SELECT tl.task_id, lb.* FROM labels lb
      INNER JOIN task_labels tl ON lb.id = tl.label_id
      WHERE tl.task_id IN (${placeholders})
    `).all(...taskIds) as any[]
    for (const lr of labelsRows) {
      const arr = labelsByTask.get(lr.task_id) || []
      arr.push(lr)
      labelsByTask.set(lr.task_id, arr)
    }

    const subTasksByTask = new Map<string, SubTask[]>()
    const subTasksRows = db.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY "order" ASC
    `).all(...taskIds) as any[]
    for (const st of subTasksRows) {
      const arr = subTasksByTask.get(st.task_id) || []
      arr.push({ ...st, completed: st.completed === 1 })
      subTasksByTask.set(st.task_id, arr)
    }

    const remindersByTask = new Map<string, Reminder[]>()
    const remindersRows = db.prepare(`
      SELECT * FROM reminders WHERE task_id IN (${placeholders})
    `).all(...taskIds) as any[]
    for (const r of remindersRows) {
      const arr = remindersByTask.get(r.task_id) || []
      arr.push(r)
      remindersByTask.set(r.task_id, arr)
    }

    const attachmentsByTask = new Map<string, Attachment[]>()
    const attachmentsRows = db.prepare(`
      SELECT * FROM attachments WHERE task_id IN (${placeholders})
    `).all(...taskIds) as any[]
    for (const a of attachmentsRows) {
      const arr = attachmentsByTask.get(a.task_id) || []
      arr.push(a)
      attachmentsByTask.set(a.task_id, arr)
    }

    return rows.map(row => mapTaskRowWithRelations(row, labelsByTask, subTasksByTask, remindersByTask, attachmentsByTask))
  },

  findById(id: string): Task | null {
    const db = getDb()
    const row = db.prepare(`
      SELECT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      WHERE t.id = ?
    `).get(id) as any

    if (!row) return null
    return mapTaskRow(row, db)
  },

  search(query: string): Task[] {
    const db = getDb()
    const searchQuery = `%${query}%`
    const rows = db.prepare(`
      SELECT DISTINCT t.*, l.id as list_id, l.name as list_name, l.color as list_color, l.emoji as list_emoji
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      LEFT JOIN task_labels tl ON t.id = tl.task_id
      LEFT JOIN labels lb ON tl.label_id = lb.id
      LEFT JOIN subtasks st ON t.id = st.task_id
      WHERE t.name LIKE ?
        OR t.description LIKE ?
        OR lb.name LIKE ?
        OR st.name LIKE ?
      ORDER BY t.created_at DESC
      LIMIT 50
    `).all(searchQuery, searchQuery, searchQuery, searchQuery) as any[]

    return rows.map(row => mapTaskRow(row, db))
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
    const params: any[] = []

    const fieldMappings: Record<string, { key: string; transform?: (v: any) => any }> = {
      name: { key: 'name' },
      description: { key: 'description' },
      listId: { key: 'list_id' },
      date: { key: 'date' },
      deadline: { key: 'deadline' },
      estimate: { key: 'estimate' },
      actualTime: { key: 'actual_time' },
      priority: { key: 'priority' },
      completed: { key: 'completed', transform: (v: boolean) => v ? 1 : 0 },
      recurringRule: { key: 'recurring_rule', transform: (v) => v ? JSON.stringify(v) : null },
    }

    for (const [inputKey, mapping] of Object.entries(fieldMappings)) {
      if (inputKey in data) {
        const value = mapping.transform ? mapping.transform(data[inputKey as keyof typeof data]) : data[inputKey as keyof typeof data]
        fields.push(`${mapping.key} = ?`)
        params.push(value)

        if (existing) {
          const oldValue = inputKey === 'listId'
            ? existing.listId
            : inputKey === 'recurringRule'
              ? (existing.recurringRule ? JSON.stringify(existing.recurringRule) : null)
              : (existing as any)[inputKey]

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
    `).all(taskId) as any[]
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
    const params: any[] = [today]

    if (listId) {
      query += ' AND list_id = ?'
      params.push(listId)
    }

    const result = db.prepare(query).get(...params) as { count: number }
    return result.count
  },
}

function mapTaskRow(row: any, db: any): Task {
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
  `).all(row.id) as any[]
  const subTasks: SubTask[] = rawSubTasks.map(st => ({
    ...st,
    completed: st.completed === 1,
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
  row: any,
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
    const rows = db.prepare(`SELECT * FROM lists ORDER BY "order" ASC, name ASC`).all() as any[]
    return rows.map(row => ({
      ...row,
      isDefault: row.is_default === 1,
    }))
  },

  findById(id: string): TaskList | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      ...row,
      isDefault: row.is_default === 1,
    }
  },

  create(data: { name: string; color?: string; emoji?: string }): TaskList {
    const db = getDb()
    const id = uuidv4()
    const maxOrder = (db.prepare('SELECT MAX("order") as maxOrder FROM lists').get() as { maxOrder: number | null }).maxOrder ?? -1

    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, "order")
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.color || '#6366f1', data.emoji || '📋', maxOrder + 1)

    return this.findById(id)!
  },

  update(id: string, data: Partial<{ name: string; color: string; emoji: string }>): TaskList | null {
    const db = getDb()
    const fields: string[] = []
    const params: any[] = []

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
    `).get(listId) as { count: number }
    return result.count
  },
}

export const labelRepository = {
  findAll(): Label[] {
    const db = getDb()
    return db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as Label[]
  },

  findById(id: string): Label | null {
    const db = getDb()
    return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | null
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
    const params: any[] = []

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
    `).get(labelId) as { count: number }
    return result.count
  },
}
