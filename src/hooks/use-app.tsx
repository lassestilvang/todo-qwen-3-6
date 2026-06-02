'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { AppState, ViewType } from '@/lib/types'

export type SortBy = 'date' | 'priority' | 'name' | 'created'
export type SortOrder = 'asc' | 'desc'

interface AppContextType extends AppState {
  viewMode: 'list' | 'kanban'
  setViewMode: (mode: 'list' | 'kanban') => void
  accentColor: string
  setAccentColor: (color: string) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  setView: (view: ViewType) => void
  setListId: (listId: string | null) => void
  setLabelId: (labelId: string | null) => void
  setSelectedTaskId: (taskId: string | null) => void
  selectedTaskIds: string[]
  setSelectedTaskIds: (taskIds: string[]) => void
  toggleTaskSelection: (taskId: string) => void
  toggleShowCompleted: () => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('today')
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [currentLabelId, setCurrentLabelId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const setView = useCallback((view: ViewType) => {
    setCurrentView(view)
    setCurrentListId(null)
    setCurrentLabelId(null)
    setSelectedTaskIds([])
  }, [])

  const setListId = useCallback((listId: string | null) => {
    setCurrentListId(listId)
    setCurrentLabelId(null)
    setSelectedTaskIds([])
  }, [])

  const setLabelId = useCallback((labelId: string | null) => {
    setCurrentLabelId(labelId)
    setCurrentListId(null)
    setSelectedTaskIds([])
  }, [])

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }, [])

  const toggleShowCompleted = useCallback(() => {
    setShowCompleted(prev => !prev)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const value = useMemo<AppContextType>(() => ({
    currentView,
    currentListId,
    currentLabelId,
    selectedTaskId,
    selectedTaskIds,
    setSelectedTaskIds,
    toggleTaskSelection,
    showCompleted,
    searchQuery,
    sidebarOpen,
    viewMode,
    setViewMode,
    accentColor,
    setAccentColor,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setView,
    setListId: setCurrentListId,
    setLabelId,
    setSelectedTaskId,
    toggleShowCompleted,
    setSearchQuery,
    toggleSidebar,
  }), [
    currentView,
    currentListId,
    currentLabelId,
    selectedTaskId,
    selectedTaskIds,
    toggleTaskSelection,
    showCompleted,
    searchQuery,
    sidebarOpen,
    viewMode,
    setViewMode,
    accentColor,
    sortBy,
    sortOrder,
    setView,
    setListId,
    setLabelId,
    toggleShowCompleted,
    toggleSidebar,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
