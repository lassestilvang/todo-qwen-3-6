import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const changes = taskRepository.getChanges(id)
    return NextResponse.json(changes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 })
  }
}
