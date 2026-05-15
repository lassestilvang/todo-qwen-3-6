'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { AppState, ViewType } from '@/lib/types'

interface AppContextType extends AppState {
  setView: (view: ViewType) => void
  setListId: (listId: string | null) => void
  setSelectedTaskId: (taskId: string | null) => void
  toggleShowCompleted: () => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('today')
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const setView = useCallback((view: ViewType) => {
    setCurrentView(view)
    setCurrentListId(null)
  }, [])

  const setListId = useCallback((listId: string | null) => {
    setCurrentListId(listId)
  }, [])

  const handleSetSelectedTaskId = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId)
  }, [])

  const toggleShowCompleted = useCallback(() => {
    setShowCompleted(prev => !prev)
  }, [])

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const value = useMemo<AppContextType>(() => ({
    currentView,
    currentListId,
    selectedTaskId,
    showCompleted,
    searchQuery,
    sidebarOpen,
    setView,
    setListId,
    setSelectedTaskId: handleSetSelectedTaskId,
    toggleShowCompleted,
    setSearchQuery: handleSetSearchQuery,
    toggleSidebar,
  }), [
    currentView,
    currentListId,
    selectedTaskId,
    showCompleted,
    searchQuery,
    sidebarOpen,
    setView,
    setListId,
    handleSetSelectedTaskId,
    toggleShowCompleted,
    handleSetSearchQuery,
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
