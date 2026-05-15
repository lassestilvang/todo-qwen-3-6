import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'
import { updateTaskSchema } from '@/lib/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = taskRepository.findById(id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const { labels, subTasks, reminders, ...taskData } = validated

    const task = taskRepository.update(id, taskData)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (labels !== undefined) {
      taskRepository.setLabels(id, labels)
    }

    if (subTasks !== undefined) {
      taskRepository.setSubTasks(id, subTasks)
    }

    if (reminders !== undefined) {
      taskRepository.setReminders(id, reminders)
    }

    const freshTask = taskRepository.findById(id)
    return NextResponse.json(freshTask)
  } catch (error: unknown) {
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: 'Validation failed', details: (error as Record<string, unknown>).issues }, { status: 400 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = taskRepository.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
