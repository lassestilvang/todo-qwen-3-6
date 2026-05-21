'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface UseCrudOptions<T> {
  baseUrl: string
  entityName: string
  fetchParams?: Record<string, string>
  createSuccessMessage?: string
  updateSuccessMessage?: string
  deleteSuccessMessage?: string
}

interface UseCrudReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  isMutating: boolean
  create: (itemData: Record<string, unknown>) => Promise<void>
  update: (id: string, itemData: Record<string, unknown>) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30_000

function getCacheKey(baseUrl: string, params?: Record<string, string>): string {
  if (!params) return baseUrl
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  return `${baseUrl}?${new URLSearchParams(sorted)}`
}

export function useCrud<T extends { id: string }>({
  baseUrl,
  entityName,
  fetchParams,
  createSuccessMessage,
  updateSuccessMessage,
  deleteSuccessMessage,
}: UseCrudOptions<T>): UseCrudReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const dataRef = useRef<T[]>([])
  const paramsString = JSON.stringify(fetchParams)
  const cacheKey = getCacheKey(baseUrl, fetchParams)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = cache.get(cacheKey)
    const isStale = !cached || Date.now() - cached.timestamp > CACHE_TTL

    if (!forceRefresh && cached && !isStale) {
      setData(cached.data as T[])
      dataRef.current = cached.data as T[]
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = fetchParams ? new URLSearchParams(fetchParams) : undefined
      const url = params ? `${baseUrl}?${params}` : baseUrl

      const res = await fetch(url)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to fetch ${entityName}`)
      }
      const result = await res.json()
      setData(result)
      dataRef.current = result
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [baseUrl, entityName, paramsString, cacheKey])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const invalidateCache = useCallback((prefix: string) => {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key)
      }
    }
  }, [])

  const create = useCallback(async (itemData: Record<string, unknown>) => {
    if (isMutating) return
    setIsMutating(true)

    const tempId = `temp-${Date.now()}`
    const optimisticItem = { ...itemData, id: tempId } as T
    setData(prev => [...prev, optimisticItem])

    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const message = errData.error || `Failed to create ${entityName}`
        const details = (errData.details as Array<{ path?: string[]; message?: string }> | undefined)
          ?.map(d => `${d.path?.join('.')}: ${d.message}`)
          .join(', ')
        throw new Error(details ? `${message}: ${details}` : message)
      }
      invalidateCache(baseUrl)
      await fetchData(true)
      toast.success(createSuccessMessage || `${entityName} created`)
    } catch (err) {
      setData(dataRef.current)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsMutating(false)
    }
  }, [baseUrl, entityName, fetchData, createSuccessMessage, isMutating, invalidateCache])

  const update = useCallback(async (id: string, itemData: Record<string, unknown>) => {
    if (isMutating) return
    setIsMutating(true)

    setData(prev => {
      const idx = prev.findIndex(item => item.id === id)
      if (idx === -1) return prev
      const updated = [...prev]
      updated[idx] = { ...prev[idx], ...itemData } as T
      return updated
    })

    try {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to update ${entityName}`)
      }
      invalidateCache(baseUrl)
      await fetchData(true)
      toast.success(updateSuccessMessage || `${entityName} updated`)
    } catch (err) {
      setData(dataRef.current)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsMutating(false)
    }
  }, [baseUrl, entityName, fetchData, updateSuccessMessage, isMutating, invalidateCache])

  const remove = useCallback(async (id: string) => {
    if (isMutating) return
    setIsMutating(true)

    setData(prev => prev.filter(item => item.id !== id))

    try {
      const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to delete ${entityName}`)
      }
      invalidateCache(baseUrl)
      await fetchData(true)
      toast.success(deleteSuccessMessage || `${entityName} deleted`)
    } catch (err) {
      setData(dataRef.current)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsMutating(false)
    }
  }, [baseUrl, entityName, fetchData, deleteSuccessMessage, isMutating, invalidateCache])

  return {
    data,
    loading,
    error,
    isMutating,
    create,
    update,
    remove,
    refresh: () => fetchData(true),
  }
}
