import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { taskRepository, listRepository, labelRepository } from '@/lib/repository'
import { getDb, closeDb, setDbPath } from '@/lib/db'
import fs from 'fs'
import path from 'path'

let testCounter = 0

function getTestDbPath() {
  return path.join(process.cwd(), 'data', `test-repo-${testCounter++}.db`)
}

function resetDb(dbPath: string) {
  closeDb()
  const files = [dbPath, dbPath + '-wal', dbPath + '-shm']
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  }
}

describe('Task Repository', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = getTestDbPath()
    resetDb(dbPath)
    setDbPath(dbPath)
  })

  afterEach(() => {
    resetDb(dbPath)
  })

  it('should create a task', () => {
    const task = taskRepository.create({
      name: 'Test Task',
      description: 'Test description',
      priority: 'high',
    })

    expect(task).toBeDefined()
    expect(task.id).toBeDefined()
    expect(task.name).toBe('Test Task')
    expect(task.description).toBe('Test description')
    expect(task.priority).toBe('high')
    expect(task.completed).toBe(false)
  })

  it('should find a task by id', () => {
    const created = taskRepository.create({ name: 'Find Me' })
    const found = taskRepository.findById(created.id)

    expect(found).toBeDefined()
    expect(found?.name).toBe('Find Me')
  })

  it('should return null for non-existent task', () => {
    const found = taskRepository.findById('non-existent-id')
    expect(found).toBeNull()
  })

  it('should update a task', () => {
    const created = taskRepository.create({ name: 'Original' })
    const updated = taskRepository.update(created.id, { name: 'Updated' })

    expect(updated).toBeDefined()
    expect(updated?.name).toBe('Updated')
  })

  it('should log changes when updating', () => {
    const created = taskRepository.create({ name: 'Original' })
    taskRepository.update(created.id, { name: 'Updated' })

    const changes = taskRepository.getChanges(created.id)
    expect(changes.length).toBe(1)
    expect(changes[0].field).toBe('name')
    expect(changes[0].newValue).toBe('Updated')
  })

  it('should delete a task (soft delete)', () => {
    const created = taskRepository.create({ name: 'Delete Me' })
    const deleted = taskRepository.delete(created.id)

    expect(deleted).toBe(true)
    const found = taskRepository.findById(created.id)
    expect(found?.deletedAt).not.toBeNull()
  })

  it('should permanently delete (purge) a task', () => {
    const created = taskRepository.create({ name: 'Purge Me' })
    const purged = taskRepository.purge(created.id)

    expect(purged).toBe(true)
    expect(taskRepository.findById(created.id)).toBeNull()
  })

  it('should toggle completion', () => {
    const created = taskRepository.create({ name: 'Complete Me' })
    expect(created.completed).toBe(false)

    const completed = taskRepository.update(created.id, { completed: true })
    expect(completed?.completed).toBe(true)
    expect(completed?.completedAt).toBeDefined()
  })

  it('should set and retrieve labels', () => {
    const db = getDb()
    const labelId = `label-${Date.now()}`
    db.prepare('INSERT INTO labels (id, name, color, icon) VALUES (?, ?, ?, ?)').run(
      labelId, 'Test Label', '#ff0000', '🏷️'
    )

    const task = taskRepository.create({ name: 'Labeled Task' })
    taskRepository.setLabels(task.id, [labelId])

    const refreshed = taskRepository.findById(task.id)
    expect(refreshed?.labels.length).toBe(1)
    expect(refreshed?.labels[0].name).toBe('Test Label')
  })

  it('should set and retrieve subtasks', () => {
    const task = taskRepository.create({ name: 'Parent Task' })
    taskRepository.setSubTasks(task.id, [
      { name: 'Subtask 1', completed: false, order: 0 },
      { name: 'Subtask 2', completed: true, order: 1 },
    ])

    const refreshed = taskRepository.findById(task.id)
    expect(refreshed?.subTasks.length).toBe(2)
    expect(refreshed?.subTasks[0].name).toBe('Subtask 1')
    expect(refreshed?.subTasks[1].completed).toBe(true)
  })

  it('should set and retrieve reminders', () => {
    const task = taskRepository.create({ name: 'Reminder Task' })
    const reminderTime = new Date().toISOString()
    taskRepository.setReminders(task.id, [
      { type: 'notification', time: reminderTime },
    ])

    const refreshed = taskRepository.findById(task.id)
    expect(refreshed?.reminders.length).toBe(1)
    expect(refreshed?.reminders[0].type).toBe('notification')
  })

  it('should filter tasks by view - today', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    taskRepository.create({ name: 'Today Task', date: today.toISOString() })

    const tasks = taskRepository.findAll('today', null, false)
    expect(tasks.length).toBe(1)
    expect(tasks[0].name).toBe('Today Task')
  })

  it('should filter tasks by view - week', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      taskRepository.create({ name: `Task ${i}`, date: date.toISOString() })
    }

    const weekTasks = taskRepository.findAll('week', null, false)
    expect(weekTasks.length).toBe(8)
  })

  it('should filter tasks by view - upcoming', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    taskRepository.create({ name: 'Yesterday', date: yesterday.toISOString() })

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    taskRepository.create({ name: 'Tomorrow', date: tomorrow.toISOString() })

    const upcomingTasks = taskRepository.findAll('upcoming', null, false)
    expect(upcomingTasks.length).toBe(1)
    expect(upcomingTasks[0].name).toBe('Tomorrow')
  })

  it('should filter tasks by view - all', () => {
    taskRepository.create({ name: 'Task 1' })
    taskRepository.create({ name: 'Task 2' })
    taskRepository.create({ name: 'Task 3' })

    const allTasks = taskRepository.findAll('all', null, false)
    expect(allTasks.length).toBe(3)
  })

  it('should exclude completed tasks when showCompleted is false', () => {
    taskRepository.create({ name: 'Active Task' })
    const completedTask = taskRepository.create({ name: 'Completed Task' })
    taskRepository.update(completedTask.id, { completed: true })

    const tasks = taskRepository.findAll('all', null, false)
    expect(tasks.length).toBe(1)
    expect(tasks[0].name).toBe('Active Task')
  })

  it('should include completed tasks when showCompleted is true', () => {
    taskRepository.create({ name: 'Active Task' })
    const completedTask = taskRepository.create({ name: 'Completed Task' })
    taskRepository.update(completedTask.id, { completed: true })

    const tasks = taskRepository.findAll('all', null, true)
    expect(tasks.length).toBe(2)
  })

  it('should filter tasks by list', () => {
    const list = listRepository.create({ name: 'Test List' })
    taskRepository.create({ name: 'List Task', listId: list.id })
    taskRepository.create({ name: 'Inbox Task' })

    const listTasks = taskRepository.findAll('all', list.id, false)
    expect(listTasks.length).toBe(1)
    expect(listTasks[0].name).toBe('List Task')
  })

  it('should search tasks by name', () => {
    taskRepository.create({ name: 'Buy groceries' })
    taskRepository.create({ name: 'Call mom' })
    taskRepository.create({ name: 'Buy shoes' })

    const results = taskRepository.search('buy')
    expect(results.length).toBe(2)
  })

  it('should search tasks by description', () => {
    taskRepository.create({ name: 'Task A', description: 'Important meeting with client' })
    taskRepository.create({ name: 'Task B', description: 'Regular check-in' })

    const results = taskRepository.search('client')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Task A')
  })

  it('should get overdue count', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    taskRepository.create({ name: 'Overdue 1', date: yesterday.toISOString() })
    taskRepository.create({ name: 'Overdue 2', date: yesterday.toISOString() })
    taskRepository.create({ name: 'Today Task' })

    const count = taskRepository.getOverdueCount()
    expect(count).toBe(2)
  })

  it('should not count completed tasks as overdue', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const overdueTask = taskRepository.create({ name: 'Overdue', date: yesterday.toISOString() })
    taskRepository.update(overdueTask.id, { completed: true })

    const count = taskRepository.getOverdueCount()
    expect(count).toBe(0)
  })

  it('should order tasks by priority', () => {
    taskRepository.create({ name: 'Low', priority: 'low' })
    taskRepository.create({ name: 'High', priority: 'high' })
    taskRepository.create({ name: 'Medium', priority: 'medium' })
    taskRepository.create({ name: 'None', priority: 'none' })

    const tasks = taskRepository.findAll('all', null, false)
    expect(tasks[0].priority).toBe('high')
    expect(tasks[1].priority).toBe('medium')
    expect(tasks[2].priority).toBe('low')
    expect(tasks[3].priority).toBe('none')
  })
})

describe('List Repository', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = getTestDbPath()
    resetDb(dbPath)
    setDbPath(dbPath)
  })

  afterEach(() => {
    resetDb(dbPath)
  })

  it('should create a list', () => {
    const list = listRepository.create({ name: 'Work', color: '#ff0000', emoji: '💼' })

    expect(list).toBeDefined()
    expect(list.name).toBe('Work')
    expect(list.color).toBe('#ff0000')
    expect(list.emoji).toBe('💼')
    expect(list.isDefault).toBe(false)
  })

  it('should find all lists', () => {
    listRepository.create({ name: 'Work' })
    listRepository.create({ name: 'Personal' })

    const lists = listRepository.findAll()
    expect(lists.length).toBe(3)
  })

  it('should update a list', () => {
    const list = listRepository.create({ name: 'Old Name' })
    const updated = listRepository.update(list.id, { name: 'New Name' })

    expect(updated?.name).toBe('New Name')
  })

  it('should not delete default list', () => {
    const result = listRepository.delete('inbox')
    expect(result).toBe(false)
  })

  it('should delete a non-default list', () => {
    const list = listRepository.create({ name: 'Delete Me' })
    const result = listRepository.delete(list.id)

    expect(result).toBe(true)
    expect(listRepository.findById(list.id)).toBeNull()
  })

  it('should get task count', () => {
    const list = listRepository.create({ name: 'Count List' })
    taskRepository.create({ name: 'Task 1', listId: list.id })
    taskRepository.create({ name: 'Task 2', listId: list.id })

    const count = listRepository.getTaskCount(list.id)
    expect(count).toBe(2)
  })
})

describe('Label Repository', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = getTestDbPath()
    resetDb(dbPath)
    setDbPath(dbPath)
  })

  afterEach(() => {
    resetDb(dbPath)
  })

  it('should create a label', () => {
    const label = labelRepository.create({ name: 'Urgent', color: '#ff0000', icon: '🔥' })

    expect(label).toBeDefined()
    expect(label.name).toBe('Urgent')
    expect(label.color).toBe('#ff0000')
    expect(label.icon).toBe('🔥')
  })

  it('should find all labels', () => {
    labelRepository.create({ name: 'Label 1' })
    labelRepository.create({ name: 'Label 2' })

    const labels = labelRepository.findAll()
    expect(labels.length).toBe(2)
  })

  it('should update a label', () => {
    const label = labelRepository.create({ name: 'Old' })
    const updated = labelRepository.update(label.id, { name: 'New' })

    expect(updated?.name).toBe('New')
  })

  it('should delete a label', () => {
    const label = labelRepository.create({ name: 'Delete Me' })
    const result = labelRepository.delete(label.id)

    expect(result).toBe(true)
    expect(labelRepository.findById(label.id)).toBeNull()
  })

  it('should get task count', () => {
    const db = getDb()
    const label = labelRepository.create({ name: 'Count Label' })
    const task = taskRepository.create({ name: 'Labeled Task' })

    db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(task.id, label.id)

    const count = labelRepository.getTaskCount(label.id)
    expect(count).toBe(1)
  })
})
