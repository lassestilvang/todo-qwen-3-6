'use client'

import { useState, useEffect, useCallback } from 'react'
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
  create: (itemData: Record<string, unknown>) => Promise<void>
  update: (id: string, itemData: Record<string, unknown>) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
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

  const fetchData = useCallback(async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [baseUrl, entityName, fetchParams])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const create = useCallback(async (itemData: Record<string, unknown>) => {
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
      await fetchData()
      toast.success(createSuccessMessage || `${entityName} created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }, [baseUrl, entityName, fetchData, createSuccessMessage])

  const update = useCallback(async (id: string, itemData: Record<string, unknown>) => {
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
      await fetchData()
      toast.success(updateSuccessMessage || `${entityName} updated`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }, [baseUrl, entityName, fetchData, updateSuccessMessage])

  const remove = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to delete ${entityName}`)
      }
      await fetchData()
      toast.success(deleteSuccessMessage || `${entityName} deleted`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast.error(message)
      throw err
    }
  }, [baseUrl, entityName, fetchData, deleteSuccessMessage])

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    refresh: fetchData,
  }
}
