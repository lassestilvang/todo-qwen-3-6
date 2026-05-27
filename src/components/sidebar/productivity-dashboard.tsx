'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Award, Clock, Flame, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Task, TaskList } from '@/lib/types'

export function ProductivityDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<TaskList[]>([])
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch all tasks and lists when stats dialog opens
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [tasksRes, listsRes] = await Promise.all([
          fetch('/api/tasks?view=all&showCompleted=true'),
          fetch('/api/lists'),
        ])
        if (tasksRes.ok && listsRes.ok) {
          const tasksData = await tasksRes.json()
          const listsData = await listsRes.json()
          setTasks(tasksData)
          setLists(listsData)
        }
      } catch (err) {
        console.error('Failed to fetch stats data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Get pomodoro stats
    const saved = localStorage.getItem('pomodoro_sessions_completed')
    if (saved) {
      setSessionsCompleted(parseInt(saved, 10))
    }
  }, [isOpen])

  // Stats calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Priority count
  const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length
  const mediumPriority = tasks.filter((t) => t.priority === 'medium' && !t.completed).length
  const lowPriority = tasks.filter((t) => t.priority === 'low' && !t.completed).length

  // Tasks by list distributions
  const listStats = lists.map((list) => {
    const listTasks = tasks.filter((t) => t.listId === list.id)
    const listCompleted = listTasks.filter((t) => t.completed).length
    const listTotal = listTasks.length
    return {
      name: list.name,
      emoji: list.emoji,
      color: list.color,
      total: listTotal,
      completed: listCompleted,
      rate: listTotal > 0 ? Math.round((listCompleted / listTotal) * 100) : 0,
    }
  })

  // Overdue count
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const overdueTasks = tasks.filter(
    (t) => t.date && !t.completed && new Date(t.date).getTime() < todayStart.getTime()
  ).length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary/85 text-foreground hover:bg-secondary border border-border/40 transition-colors"
          />
        }
      >
        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
        Productivity Stats
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Productivity Stats
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Calculating metrics...</span>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Completion rate ring/progress */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/20 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overall Completion Rate
                </span>
                <h3 className="text-2xl font-extrabold">{completionRate}%</h3>
                <p className="text-xs text-muted-foreground">
                  You have completed {completedTasks} of your {totalTasks} total tasks.
                </p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" className="stroke-muted/20" strokeWidth="3" fill="none" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="stroke-indigo-500"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="100, 100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - completionRate }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <Award className="absolute w-6 h-6 text-indigo-500" />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Completed Tasks
                </span>
                <h4 className="text-lg font-bold text-emerald-500">{completedTasks}</h4>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Tasks
                </span>
                <h4 className="text-lg font-bold text-indigo-500">{pendingTasks}</h4>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Overdue <AlertCircle className="w-3 h-3 text-red-400" />
                </span>
                <h4 className="text-lg font-bold text-red-400">{overdueTasks}</h4>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Focus Sessions <Flame className="w-3 h-3 text-orange-500" />
                </span>
                <h4 className="text-lg font-bold text-orange-500">{sessionsCompleted}</h4>
              </div>
            </div>

            {/* Tasks by priority */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Priority Backlog
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> High Priority
                  </span>
                  <span className="font-semibold text-muted-foreground">{highPriority} pending</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Medium Priority
                  </span>
                  <span className="font-semibold text-muted-foreground">{mediumPriority} pending</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Low Priority
                  </span>
                  <span className="font-semibold text-muted-foreground">{lowPriority} pending</span>
                </div>
              </div>
            </div>

            {/* Tasks by list breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Performance by List
              </h4>
              <div className="space-y-3">
                {listStats.map((list) => (
                  <div key={list.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold flex items-center gap-1">
                        <span>{list.emoji}</span>
                        <span>{list.name}</span>
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold">
                        {list.completed}/{list.total} ({list.rate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/20">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: list.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${list.rate}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
