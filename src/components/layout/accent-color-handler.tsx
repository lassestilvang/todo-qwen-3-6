'use client'

import { useApp } from '@/hooks/use-app'
import { useEffect } from 'react'

export function AccentColorHandler() {
  const { accentColor } = useApp()

  useEffect(() => {
    if (!accentColor) return

    const root = document.documentElement
    
    // Function to convert hex to HSL for better manipulation with Tailwind
    const hexToHsl = (hex: string) => {
      let r = 0, g = 0, b = 0
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16)
        g = parseInt(hex[2] + hex[2], 16)
        b = parseInt(hex[3] + hex[3], 16)
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16)
        g = parseInt(hex.substring(3, 5), 16)
        b = parseInt(hex.substring(5, 7), 16)
      }
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    }

    const hsl = hexToHsl(accentColor)
    
    // Set --primary variable in HSL format for Tailwind v4 compatibility if needed
    // or just direct hex if using CSS variables
    root.style.setProperty('--primary', accentColor)
    root.style.setProperty('--primary-foreground', hsl.l > 60 ? '#000000' : '#ffffff')
    
    // Update shadcn variables if they are used
    root.style.setProperty('--primary-hsl', `${hsl.h} ${hsl.s}% ${hsl.l}%`)

  }, [accentColor])

  return null
}
