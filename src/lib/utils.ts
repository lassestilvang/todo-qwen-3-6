import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import React from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? React.createElement('mark', { key: i, className: "bg-primary/30 text-foreground rounded-sm px-0.5" }, part)
      : part
  )
}
