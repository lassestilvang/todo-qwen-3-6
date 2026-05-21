'use client'

import { Task } from '@/lib/types'
import { TaskItem } from './task-item'
import { AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { useRef, useState, useEffect, useCallback } from 'react'

const ITEM_HEIGHT = 88
const BUFFER_SIZE = 5

interface TaskListProps {
  tasks: Task[]
  onToggle: (task: Task) => void
  onSelect: (task: Task) => void
  selectedTaskId: string | null
}

export function TaskList({ tasks, onToggle, onSelect, selectedTaskId }: TaskListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setContainerHeight(container.clientHeight)

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  const totalHeight = tasks.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
  const endIndex = Math.min(
    tasks.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  )

  const visibleTasks = tasks.slice(startIndex, endIndex)
  const offsetY = startIndex * ITEM_HEIGHT

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-zinc-400 font-medium">No tasks yet</h3>
        <p className="text-zinc-600 text-sm mt-1">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto" onScroll={handleScroll}>
      <div className="relative space-y-2 p-4 pr-2" style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <AnimatePresence>
            {visibleTasks.map(task => (
              <div key={task.id} style={{ height: ITEM_HEIGHT }}>
                <TaskItem
                  task={task}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  isSelected={selectedTaskId === task.id}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
