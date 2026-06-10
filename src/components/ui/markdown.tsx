'use client'

import { useMemo } from 'react'

const inlineCodeRegex = /`([^`]+)`/g
const boldRegex = /\*\*([^*]+)\*\*/g
const italicRegex = /_([^_]+)_/g
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
const strikethroughRegex = /~~([^~]+)~~/g

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  const html = useMemo(() => {
    let result = children
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    result = result.replace(inlineCodeRegex, '<code class="bg-secondary/60 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    result = result.replace(boldRegex, '<strong class="font-bold">$1</strong>')
    result = result.replace(italicRegex, '<em>$1</em>')
    result = result.replace(strikethroughRegex, '<del class="line-through opacity-60">$1</del>')
    result = result.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-80">$1</a>')

    const lines = result.split('\n')
    const processed: string[] = []
    let inList = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          processed.push('<ul class="list-disc list-inside space-y-0.5 my-1">')
          inList = true
        }
        processed.push(`<li class="text-sm">${line.slice(2)}</li>`)
      } else {
        if (inList) {
          processed.push('</ul>')
          inList = false
        }

        if (line.trim() === '') {
          processed.push('<br />')
        } else if (line.startsWith('### ')) {
          processed.push(`<h3 class="text-sm font-bold mt-2 mb-1">${line.slice(4)}</h3>`)
        } else if (line.startsWith('## ')) {
          processed.push(`<h2 class="text-base font-bold mt-3 mb-1">${line.slice(3)}</h2>`)
        } else {
          processed.push(`<span class="text-sm leading-relaxed">${line}</span>`)
        }
      }
    }

    if (inList) processed.push('</ul>')

    return processed.join('\n')
  }, [children])

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  )
}
