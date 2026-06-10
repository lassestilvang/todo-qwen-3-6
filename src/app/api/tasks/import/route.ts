import { NextRequest, NextResponse } from 'next/server'
import { taskRepository, listRepository, labelRepository } from '@/lib/repository'
import { handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'Invalid format: tasks array required' }, { status: 400 })
    }

    const imported: { tasks: number; lists: number; labels: number } = { tasks: 0, lists: 0, labels: 0 }

    if (body.lists && Array.isArray(body.lists)) {
      for (const list of body.lists) {
        try {
          listRepository.create(list)
          imported.lists++
        } catch {
          // Skip duplicates
        }
      }
    }

    if (body.labels && Array.isArray(body.labels)) {
      for (const label of body.labels) {
        try {
          labelRepository.create(label)
          imported.labels++
        } catch {
          // Skip duplicates
        }
      }
    }

    for (const task of body.tasks) {
      try {
        const { labels, subTasks, reminders, ...taskData } = task
        const created = taskRepository.create({
          ...taskData,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          completedAt: undefined,
          sortOrder: undefined,
        })

        if (labels && labels.length > 0) {
          const labelIds = labels.map((l: { id: string } | string) => typeof l === 'string' ? l : l.id)
          taskRepository.setLabels(created.id, labelIds)
        }

        if (subTasks && subTasks.length > 0) {
          taskRepository.setSubTasks(created.id, subTasks)
        }

        if (reminders && reminders.length > 0) {
          taskRepository.setReminders(created.id, reminders)
        }

        imported.tasks++
      } catch (err) {
        console.error('Failed to import task:', err)
      }
    }

    return NextResponse.json(imported)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to import data')
  }
}
