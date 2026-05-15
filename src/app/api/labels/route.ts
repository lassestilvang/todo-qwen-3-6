import { NextRequest, NextResponse } from 'next/server'
import { labelRepository } from '@/lib/repository'
import { createLabelSchema } from '@/lib/validation'

export async function GET() {
  try {
    const labels = labelRepository.findAll()
    return NextResponse.json(labels)
  } catch {
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
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: 'Validation failed', details: (error as Record<string, unknown>).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}
