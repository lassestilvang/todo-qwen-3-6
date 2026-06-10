'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTasks } from '@/hooks/use-data'
import { useApp } from '@/hooks/use-app'
import { toast } from 'sonner'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const MODE_CONFIG = {
  work: {
    duration: 25 * 60,
    label: 'Focus Session',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    icon: Brain,
    accent: '#6366f1',
  },
  shortBreak: {
    duration: 5 * 60,
    label: 'Short Break',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    icon: Coffee,
    accent: '#10b981',
  },
  longBreak: {
    duration: 15 * 60,
    label: 'Long Break',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    icon: Coffee,
    accent: '#06b6d4',
  },
}

export function PomodoroTimer() {
  const { currentView, currentListId, showCompleted, currentLabelId } = useApp()
  const { tasks, toggleComplete } = useTasks(currentView, currentListId, showCompleted, currentLabelId)

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_sessions_completed')
    if (saved) {
      const parsed = parseInt(saved, 10)
      setTimeout(() => setSessionsCompleted(parsed), 0)
    }
  }, [])

  // Synthesize alarm sound using AudioContext (no external files needed)
  const playAlarmSound = (type: 'tick' | 'complete' | 'click') => {
    if (isMuted) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      if (type === 'complete') {
        // High quality sweet success sound (two rising chords)
        const now = ctx.currentTime
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gainNode = ctx.createGain()

        osc1.type = 'sine'
        osc2.type = 'triangle'

        osc1.frequency.setValueAtTime(523.25, now) // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3) // C6
        
        osc2.frequency.setValueAtTime(659.25, now) // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3) // E6

        gainNode.gain.setValueAtTime(0.15, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

        osc1.connect(gainNode)
        osc2.connect(gainNode)
        gainNode.connect(ctx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.4)
        osc2.stop(now + 0.4)
      } else if (type === 'click') {
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, now)
        gainNode.gain.setValueAtTime(0.05, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.05)
      }
    } catch {
      // Audio context might be blocked or unsupported
    }
  }

  const handleTimerComplete = () => {
    setIsRunning(false)
    playAlarmSound('complete')

    if (mode === 'work') {
      const newCount = sessionsCompleted + 1
      setSessionsCompleted(newCount)
      localStorage.setItem('pomodoro_sessions_completed', newCount.toString())
      
      // Auto complete the focused task if selected and confirmed
      const task = tasks.find(t => t.id === focusTaskId)
      if (task) {
        toast.success(`Focus session completed! Great job on: "${task.name}"`, {
          description: 'Focus task has been marked complete!',
          action: {
            label: 'Undo',
            onClick: () => toggleComplete(task),
          },
        })
        if (!task.completed) {
          toggleComplete(task)
        }
      } else {
        toast.success('Focus session completed! Time for a well-deserved break.')
      }
      setMode('shortBreak')
      setTimeLeft(MODE_CONFIG.shortBreak.duration)
    } else {
      toast.info('Break completed! Ready to focus?')
      setMode('work')
      setTimeLeft(MODE_CONFIG.work.duration)
    }
  }

  const handleTimerCompleteRef = useRef(handleTimerComplete)
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete
  })

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerCompleteRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const toggleTimer = () => {
    playAlarmSound('click')
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    playAlarmSound('click')
    setIsRunning(false)
    setTimeLeft(MODE_CONFIG[mode].duration)
  }

  const switchMode = (newMode: TimerMode) => {
    playAlarmSound('click')
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(MODE_CONFIG[newMode].duration)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  };

  const currentMode = MODE_CONFIG[mode]
  const totalDuration = currentMode.duration
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) : 0
  const ModeIcon = currentMode.icon

  // Circular progress stroke logic
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const activeTask = tasks.find(t => t.id === focusTaskId)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors relative"
            aria-label="Open focus timer"
          />
        }
      >
        <Timer className="w-4 h-4" />
        {isRunning && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Focus Space
          </DialogTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Mode Switcher */}
          <div className="flex bg-secondary/55 p-1 rounded-xl gap-1 mb-8 w-full border border-border/20">
            {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* Circle Timer display */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background Circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-muted/20"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                stroke={currentMode.accent}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.35, ease: 'linear' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center">
              <ModeIcon className={`w-8 h-8 ${currentMode.color} mb-1.5`} />
              <span className="text-3xl font-extrabold tracking-tight font-mono tabular-nums leading-none">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                {currentMode.label}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-10 w-10 rounded-full border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={toggleTimer}
              className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 text-white`}
              style={{ backgroundColor: currentMode.accent }}
            >
              {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </Button>

            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/55 text-muted-foreground text-xs font-semibold">
              {sessionsCompleted}🎯
            </div>
          </div>

          {/* Integrated Focus Task Selector */}
          {mode === 'work' && (
            <div className="w-full border-t border-border/40 pt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Focusing on:
              </label>

              {activeTask ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{activeTask.name}</span>
                  </div>
                  <button
                    onClick={() => setFocusTaskId(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={focusTaskId || ''}
                  onChange={(e) => setFocusTaskId(e.target.value || null)}
                  className="w-full bg-secondary/40 border border-border/50 text-sm rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" className="bg-card">-- Select a task to focus on --</option>
                  {tasks
                    .filter((t) => !t.completed)
                    .map((t) => (
                      <option key={t.id} value={t.id} className="bg-card">
                        {t.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
