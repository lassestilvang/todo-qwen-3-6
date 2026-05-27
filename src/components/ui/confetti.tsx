'use client'

import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  color: string
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
]

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isActive, setIsActive] = useState(false)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const triggerConfetti = () => {
      setIsActive(true)
      initParticles()
    }

    window.addEventListener('trigger-confetti', triggerConfetti)
    return () => window.removeEventListener('trigger-confetti', triggerConfetti)
  }, [])

  const initParticles = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const particles: Particle[] = []

    // Spawning 80 confetti particles from the bottom or sides
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: height + Math.random() * 20, // start just below screen
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speedX: Math.random() * 6 - 3,
        speedY: -(Math.random() * 12 + 10), // shoot upwards
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
        opacity: 1,
      })
    }

    particlesRef.current = particles
  };

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current

      let activeCount = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.opacity <= 0) continue

        // Apply physics
        p.x += p.speedX
        p.y += p.speedY
        p.speedY += 0.35 // gravity
        p.speedX *= 0.98 // air resistance
        p.rotation += p.rotationSpeed
        
        // Start fading after peak
        if (p.speedY > 0) {
          p.opacity -= 0.012
        }

        // Draw particle
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5)
        ctx.restore()

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          activeCount++
        }
      }

      if (activeCount > 0) {
        animationFrameRef.current = requestAnimationFrame(updateAndDraw)
      } else {
        setIsActive(false)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAndDraw)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
