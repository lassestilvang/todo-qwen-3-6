import { NextRequest, NextResponse } from 'next/server'
import { listRepository } from '@/lib/repository'
import { updateListSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const list = listRepository.findById(id)

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateListSchema.parse(body)
    const list = listRepository.update(id, validated)

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json(list)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update list')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = listRepository.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'List not found or cannot be deleted' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}
