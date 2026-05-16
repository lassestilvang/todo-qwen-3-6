import { NextRequest, NextResponse } from 'next/server'
import { listRepository } from '@/lib/repository'
import { createListSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

export async function GET() {
  try {
    const lists = listRepository.findAll()
    return NextResponse.json(lists)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createListSchema.parse(body)
    const list = listRepository.create(validated)
    return NextResponse.json(list, { status: 201 })
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create list')
  }
}
