import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restored = taskRepository.restore(id)

    if (!restored) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 })
  }
}
