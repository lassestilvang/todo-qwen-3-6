import { NextRequest, NextResponse } from 'next/server'
import { listRepository } from '@/lib/repository'
import { createListSchema } from '@/lib/validation'

export async function GET() {
  try {
    const lists = listRepository.findAll()
    return NextResponse.json(lists)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createListSchema.parse(body)
    const list = listRepository.create(validated)
    return NextResponse.json(list, { status: 201 })
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}
