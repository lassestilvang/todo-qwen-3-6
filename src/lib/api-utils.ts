import { NextResponse } from 'next/server'
import { z } from 'zod'

export function handleApiError(error: unknown, message = 'An unexpected error occurred'): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.issues },
      { status: 400 }
    )
  }
  console.error(message, error)
  return NextResponse.json({ error: message }, { status: 500 })
}
