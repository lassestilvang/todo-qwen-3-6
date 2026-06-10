import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body as { orderedIds: string[] }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 })
    }

    taskRepository.reorder(orderedIds)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to reorder tasks:', error)
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
  }
}
