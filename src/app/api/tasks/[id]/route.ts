import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'
import { updateTaskSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

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
    return handleApiError(error, 'Failed to update task')
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
