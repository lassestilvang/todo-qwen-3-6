import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'
import { createTaskSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'all'
    const listId = searchParams.get('listId')
    const labelId = searchParams.get('labelId')
    const showCompleted = searchParams.get('showCompleted') === 'true'
    const search = searchParams.get('search')

    if (search) {
      const tasks = taskRepository.search(search)
      return NextResponse.json(tasks)
    }

    const tasks = taskRepository.findAll(view, listId, showCompleted, labelId)
    return NextResponse.json(tasks)
  } catch (error: unknown) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    const { labels, subTasks, reminders, ...taskData } = validated

    const task = taskRepository.create(taskData)

    if (labels.length > 0) {
      taskRepository.setLabels(task.id, labels)
    }

    if (subTasks.length > 0) {
      taskRepository.setSubTasks(task.id, subTasks)
    }

    if (reminders.length > 0) {
      taskRepository.setReminders(task.id, reminders)
    }

    const freshTask = taskRepository.findById(task.id)
    return NextResponse.json(freshTask, { status: 201 })
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create task')
  }
}
