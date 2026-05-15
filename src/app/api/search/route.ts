import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/lib/repository'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const tasks = taskRepository.search(query.trim())
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
