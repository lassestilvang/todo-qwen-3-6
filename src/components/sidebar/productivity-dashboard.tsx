'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, Flame, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Task, TaskList } from '@/lib/types'
import { cn } from '@/lib/utils'

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
      } catch {
        console.error('Failed to fetch stats data:')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Get pomodoro stats
    const saved = localStorage.getItem('pomodoro_sessions_completed')
    if (saved) {
      const parsed = parseInt(saved, 10)
      setTimeout(() => setSessionsCompleted(parsed), 0)
    }
  }, [isOpen])

  // Stats calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
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

  // Streak calculation
  const calculateStreak = () => {
    if (tasks.length === 0) return 0
    
    const completedDates = tasks
      .filter(t => t.completed && t.completedAt)
      .map(t => new Date(t.completedAt!).toISOString().split('T')[0])
    
    if (completedDates.length === 0) return 0
    
    const uniqueDates = Array.from(new Set(completedDates)).sort().reverse()
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(new Date().getTime() - 86400000).toISOString().split('T')[0]
    
    // If no tasks completed today or yesterday, streak is broken
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0
    
    const currentDate = new Date(uniqueDates[0])
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = uniqueDates[i]
      const expectedDateStr = currentDate.toISOString().split('T')[0]
      
      if (dateStr === expectedDateStr) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const streak = calculateStreak()
  
  // Productivity Score Calculation
  const calculateProductivityScore = () => {
    const score = Math.round(
      (completionRate * 0.4) + 
      (Math.min(streak, 10) * 3) + 
      (Math.min(sessionsCompleted, 10) * 2) 
    )
    return Math.min(score, 100)
  }
  const productivityScore = calculateProductivityScore()

  // Level & XP gamification calculations
  const totalXP = (completedTasks * 15) + (sessionsCompleted * 50)
  const xpPerLevel = 100
  const level = Math.floor(totalXP / xpPerLevel) + 1
  const xpInCurrentLevel = totalXP % xpPerLevel
  const progressToNextLevel = (xpInCurrentLevel / xpPerLevel) * 100

  const getRank = (lvl: number) => {
    if (lvl <= 2) return { title: 'Task Initiate', emoji: '🎯', color: 'text-blue-400' }
    if (lvl <= 5) return { title: 'Focus Apprentice', emoji: '🧠', color: 'text-emerald-400' }
    if (lvl <= 9) return { title: 'Efficiency Knight', emoji: '⚔️', color: 'text-amber-400' }
    if (lvl <= 14) return { title: 'Productivity Ninja', emoji: '🥷', color: 'text-purple-400' }
    if (lvl <= 20) return { title: 'Focus Shogun', emoji: '👑', color: 'text-rose-400' }
    return { title: 'Antigravity Overlord', emoji: '🚀', color: 'text-indigo-400 font-extrabold animate-pulse' }
  }

  const rank = getRank(level)

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
            {/* XP & Leveling Gamification */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Productivity Rank
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-foreground">{rank.title}</span>
                    <span>{rank.emoji}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Level
                  </span>
                  <span className="text-2xl font-black text-indigo-500">{level}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Progress to Next Level</span>
                  <span>{xpInCurrentLevel} / {xpPerLevel} XP</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextLevel}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Productivity Score card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  Productivity Score
                </span>
                <h3 className="text-4xl font-extrabold text-indigo-100">{productivityScore}</h3>
                <p className="text-xs text-indigo-300/70">
                  Based on completion, streak, and focus.
                </p>
              </div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" className="stroke-indigo-900/40" strokeWidth="3" fill="none" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="stroke-indigo-400"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="100, 100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - productivityScore }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <TrendingUp className="absolute w-8 h-8 text-indigo-300" />
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
                  Daily Streak
                </span>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-lg font-bold text-orange-500">{streak}</h4>
                  {streak > 0 && <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Overdue <AlertCircle className="w-3 h-3 text-red-400" />
                </span>
                <h4 className="text-lg font-bold text-red-400">{overdueTasks}</h4>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Focus Sessions
                </span>
                <h4 className="text-lg font-bold text-indigo-500">{sessionsCompleted}</h4>
              </div>
            </div>

            {/* 7-Day Activity Chart */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Last 7 Days Activity</span>
                <span className="text-[10px] lowercase font-normal">Completed tasks</span>
              </h4>
              <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 px-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - (6 - i))
                  const dayStr = date.toISOString().split('T')[0]
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                  
                  const dayTasks = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dayStr)).length
                  const maxTasks = Math.max(...Array.from({ length: 7 }).map((_, j) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - j))
                    const ds = d.toISOString().split('T')[0]
                    return tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(ds)).length
                  }), 1)
                  
                  const height = (dayTasks / maxTasks) * 100
                  const isToday = i === 6

                  return (
                    <div key={dayStr} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="w-full bg-secondary/30 rounded-t-md overflow-hidden flex items-end h-20">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                          className={cn(
                            "w-full rounded-t-sm",
                            isToday ? "bg-indigo-500" : "bg-indigo-500/40 group-hover:bg-indigo-500/60 transition-colors"
                          )}
                        />
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold",
                        isToday ? "text-indigo-500" : "text-muted-foreground"
                      )}>
                        {dayName[0]}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {dayTasks} tasks
                      </div>
                    </div>
                  )
                })}
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
