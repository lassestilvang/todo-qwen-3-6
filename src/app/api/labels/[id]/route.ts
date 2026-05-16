import { NextRequest, NextResponse } from 'next/server'
import { labelRepository } from '@/lib/repository'
import { updateLabelSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const label = labelRepository.findById(id)

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json(label)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch label' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateLabelSchema.parse(body)
    const label = labelRepository.update(id, validated)

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json(label)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update label')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = labelRepository.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}
