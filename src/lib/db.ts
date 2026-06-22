import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'planner.db')

let db: Database.Database | null = null
let dbPath: string = DEFAULT_DB_PATH

export function setDbPath(newPath: string) {
  closeDb()
  dbPath = newPath
}

export function getDb(): Database.Database {
  if (db) return db

  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initializeSchema(db)

  // Migration: Add deleted_at to tasks if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>
    if (!tableInfo.some(col => col.name === 'deleted_at')) {
      db.exec("ALTER TABLE tasks ADD COLUMN deleted_at TEXT")
    }
    if (!tableInfo.some(col => col.name === 'actual_time_seconds')) {
      db.exec("ALTER TABLE tasks ADD COLUMN actual_time_seconds INTEGER NOT NULL DEFAULT 0")
    }
    if (!tableInfo.some(col => col.name === 'sort_order')) {
      db.exec("ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
      db.exec("UPDATE tasks SET sort_order = CAST(strftime('%s', created_at) AS INTEGER) WHERE sort_order = 0")
    }
  } catch (err) {
    console.error("Migration failed:", err)
  }

  return db
}

function initializeSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      emoji TEXT NOT NULL DEFAULT '📋',
      is_default INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT '🏷️',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      list_id TEXT REFERENCES lists(id) ON DELETE SET NULL,
      date TEXT,
      deadline TEXT,
      estimate TEXT,
      actual_time TEXT,
      actual_time_seconds INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'none' CHECK(priority IN ('high', 'medium', 'low', 'none')),
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      recurring_rule TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'notification' CHECK(type IN ('notification', 'email')),
      time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      mime_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS task_dependencies (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      dependency_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, dependency_id)
    );

    CREATE TABLE IF NOT EXISTS task_changes (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_changes_task_id ON task_changes(task_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
      name,
      description,
      content='tasks',
      content_rowid='rowid',
      tokenize='unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS tasks_fts_insert AFTER INSERT ON tasks
    BEGIN
      INSERT INTO tasks_fts(rowid, name, description)
      VALUES (new.rowid, new.name, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS tasks_fts_delete AFTER DELETE ON tasks
    BEGIN
      INSERT INTO tasks_fts(tasks_fts, rowid, name, description)
      VALUES('delete', old.rowid, old.name, old.description);
    END;

    CREATE TRIGGER IF NOT EXISTS tasks_fts_update AFTER UPDATE ON tasks
    BEGIN
      INSERT INTO tasks_fts(tasks_fts, rowid, name, description)
      VALUES('delete', old.rowid, old.name, old.description);
      INSERT INTO tasks_fts(rowid, name, description)
      VALUES (new.rowid, new.name, new.description);
    END;
  `)

  const inboxExists = database.prepare('SELECT id FROM lists WHERE is_default = 1').get()
  if (!inboxExists) {
    database.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, "order")
      VALUES (?, 'Inbox', '#6366f1', '📥', 1, 0)
    `).run('inbox')
  }

  const ftsNeedsRebuild = database.prepare("SELECT count(*) as count FROM tasks_fts WHERE tasks_fts = 'inst'").get()
  if (ftsNeedsRebuild && (ftsNeedsRebuild as { count: number }).count === 0) {
    const taskCount = database.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
    if (taskCount.count > 0) {
      database.exec(`INSERT INTO tasks_fts(tasks_fts) VALUES('rebuild')`)
    }
  }

  deduplicateLists(database)
  deduplicateLabels(database)
}

function deduplicateLists(database: Database.Database) {
  try {
    const lists = database.prepare('SELECT id, name, is_default FROM lists').all() as Array<{ id: string, name: string, is_default: number }>
    const groups = new Map<string, Array<{ id: string, name: string, is_default: number }>>()
    for (const list of lists) {
      const key = list.name.toLowerCase().trim()
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(list)
    }

    for (const listGroup of groups.values()) {
      if (listGroup.length <= 1) continue

      // Find the primary list (prefer default list, then first item)
      let primary = listGroup.find(l => l.is_default === 1)
      if (!primary) {
        primary = listGroup[0]
      }

      for (const list of listGroup) {
        if (list.id === primary.id) continue

        // Update any tasks referencing the duplicate list to the primary list
        database.prepare('UPDATE tasks SET list_id = ? WHERE list_id = ?').run(primary.id, list.id)
        
        // Delete the duplicate list
        database.prepare('DELETE FROM lists WHERE id = ?').run(list.id)
      }
    }
  } catch (err) {
    console.error("Deduplication of lists failed:", err)
  }
}

function deduplicateLabels(database: Database.Database) {
  try {
    const labels = database.prepare('SELECT id, name FROM labels').all() as Array<{ id: string, name: string }>
    const groups = new Map<string, Array<{ id: string, name: string }>>()
    for (const label of labels) {
      const key = label.name.toLowerCase().trim()
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(label)
    }

    for (const labelGroup of groups.values()) {
      if (labelGroup.length <= 1) continue

      // Find the primary label
      const primary = labelGroup[0]

      for (const label of labelGroup) {
        if (label.id === primary.id) continue

        // In task_labels, if a task already has the primary label, we want to delete this link.
        // Otherwise update the label_id to primary.id
        const tasksWithDuplicate = database.prepare('SELECT task_id FROM task_labels WHERE label_id = ?').all(label.id) as Array<{ task_id: string }>
        for (const t of tasksWithDuplicate) {
          const hasPrimary = database.prepare('SELECT 1 FROM task_labels WHERE task_id = ? AND label_id = ?').get(t.task_id, primary.id)
          if (hasPrimary) {
            database.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(t.task_id, label.id)
          } else {
            database.prepare('UPDATE task_labels SET label_id = ? WHERE task_id = ? AND label_id = ?').run(primary.id, t.task_id, label.id)
          }
        }

        // Delete the duplicate label
        database.prepare('DELETE FROM labels WHERE id = ?').run(label.id)
      }
    }
  } catch (err) {
    console.error("Deduplication of labels failed:", err)
  }
}



export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
