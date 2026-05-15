import { NextRequest, NextResponse } from 'next/server'
import { listRepository } from '@/lib/repository'
import { updateListSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const list = listRepository.findById(id)

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json(list)
  } catch (error) {
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
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = listRepository.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'List not found or cannot be deleted' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}
