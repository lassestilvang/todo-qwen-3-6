import { NextRequest, NextResponse } from 'next/server'
import { labelRepository } from '@/lib/repository'
import { createLabelSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/api-utils'

export async function GET() {
  try {
    const labels = labelRepository.findAll()
    return NextResponse.json(labels)
  } catch (error: unknown) {
    console.error('Failed to fetch labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createLabelSchema.parse(body)
    const label = labelRepository.create(validated)
    return NextResponse.json(label, { status: 201 })
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create label')
  }
}
