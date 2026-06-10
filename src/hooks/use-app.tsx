'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react'
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
  showOverdue: boolean
  toggleShowOverdue: () => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  focusMode: boolean
  toggleFocusMode: () => void
}

const AppContext = createContext<AppContextType | null>(null)

function getInitial<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    if (typeof fallback === 'boolean') return (stored === 'true') as T
    return stored as T
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('today')
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [currentLabelId, setCurrentLabelId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(() => getInitial('app_show_completed', false))
  const [showOverdue, setShowOverdue] = useState(() => getInitial('app_show_overdue', false))
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() => getInitial('app_sidebar_open', true))
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    const saved = getInitial<string | null>('app_view_mode', null)
    return saved === 'kanban' || saved === 'list' ? saved : 'list'
  })
  const [accentColor, setAccentColor] = useState(() => getInitial('app_accent_color', '#6366f1'))
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const saved = getInitial<string | null>('app_sort_by', null)
    return (['date', 'priority', 'name', 'created'] as SortBy[]).includes(saved as SortBy) ? saved as SortBy : 'date'
  })
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const saved = getInitial<string | null>('app_sort_order', null)
    return saved === 'asc' || saved === 'desc' ? saved : 'asc'
  })
  const [focusMode, setFocusMode] = useState(() => getInitial('app_focus_mode', false))

  useEffect(() => {
    localStorage.setItem('app_accent_color', accentColor)
  }, [accentColor])

  useEffect(() => {
    localStorage.setItem('app_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('app_show_completed', showCompleted.toString())
  }, [showCompleted])

  useEffect(() => {
    localStorage.setItem('app_show_overdue', showOverdue.toString())
  }, [showOverdue])

  useEffect(() => {
    localStorage.setItem('app_sidebar_open', sidebarOpen.toString())
  }, [sidebarOpen])

  useEffect(() => {
    localStorage.setItem('app_sort_by', sortBy)
  }, [sortBy])

  useEffect(() => {
    localStorage.setItem('app_sort_order', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    localStorage.setItem('app_focus_mode', focusMode.toString())
  }, [focusMode])

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

  const toggleShowOverdue = useCallback(() => {
    setShowOverdue(prev => !prev)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev)
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
    showOverdue,
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
    setListId,
    setLabelId,
    setSelectedTaskId,
    toggleShowCompleted,
    toggleShowOverdue,
    setSearchQuery,
    toggleSidebar,
    focusMode,
    toggleFocusMode,
  }), [
    currentView,
    currentListId,
    currentLabelId,
    selectedTaskId,
    selectedTaskIds,
    toggleTaskSelection,
    showCompleted,
    showOverdue,
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
    toggleShowOverdue,
    toggleSidebar,
    focusMode,
    toggleFocusMode,
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
