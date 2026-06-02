'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { AppState, ViewType } from '@/lib/types'

interface AppContextType extends AppState {
  viewMode: 'list' | 'kanban'
  setViewMode: (mode: 'list' | 'kanban') => void
  setView: (view: ViewType) => void
  setListId: (listId: string | null) => void
  setLabelId: (labelId: string | null) => void
  setSelectedTaskId: (taskId: string | null) => void
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
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  const setView = useCallback((view: ViewType) => {
    setCurrentView(view)
    setCurrentListId(null)
    setCurrentLabelId(null)
  }, [])

  const setListId = useCallback((listId: string | null) => {
    setCurrentListId(listId)
    setCurrentLabelId(null)
  }, [])

  const setLabelId = useCallback((labelId: string | null) => {
    setCurrentLabelId(labelId)
    setCurrentListId(null)
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
    showCompleted,
    searchQuery,
    sidebarOpen,
    viewMode,
    setViewMode,
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
    showCompleted,
    searchQuery,
    sidebarOpen,
    viewMode,
    setViewMode,
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
