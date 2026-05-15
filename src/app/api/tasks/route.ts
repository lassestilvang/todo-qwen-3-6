import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'
import { createTaskSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'all'
    const listId = searchParams.get('listId')
    const showCompleted = searchParams.get('showCompleted') === 'true'
    const search = searchParams.get('search')

    if (search) {
      const tasks = taskRepository.search(search)
      return NextResponse.json(tasks)
    }

    const tasks = taskRepository.findAll(view, listId, showCompleted)
    return NextResponse.json(tasks)
  } catch {
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
    if (error instanceof Error && 'issues' in error) {
      const issues = (error as Record<string, unknown>).issues
      console.error('Validation issues:', JSON.stringify(issues, null, 2))
      return NextResponse.json({ error: 'Validation failed', details: issues }, { status: 400 })
    }
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
