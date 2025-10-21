"use client"

import { useEffect, useState, useCallback } from "react"

interface WormSegment {
  x: number
  y: number
}

interface PlayerWorm {
  id: string
  segments: WormSegment[]
  direction: { x: number; y: number }
  color: string
  speed: number
  isPlayer: boolean
}

interface DecorativeWorm {
  id: string
  x: number
  y: number
  size: number
  color: string
  speed: number
  isPlayer: false
}

type Worm = PlayerWorm | DecorativeWorm

export function SnakeWorms() {
  const [worms, setWorms] = useState<Worm[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    const initialWorms: Worm[] = [
      // Serpiente del jugador
      {
        id: "player",
        segments: [
          { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          { x: window.innerWidth / 2 - 20, y: window.innerHeight / 2 },
          { x: window.innerWidth / 2 - 40, y: window.innerHeight / 2 },
          { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 },
        ],
        direction: { x: 1, y: 0 },
        color: "snake-green",
        speed: 2,
        isPlayer: true,
      },
      // Serpientes decorativas
      {
        id: "blue-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 80,
        color: "snake-blue",
        speed: 0.3,
        isPlayer: false,
      },
      {
        id: "pink-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 50,
        color: "snake-pink",
        speed: 0.7,
        isPlayer: false,
      },
    ]

    setWorms(initialWorms)

    window.addEventListener("mousemove", handleMouseMove)

    const animateWorms = () => {
      setWorms((prevWorms) =>
        prevWorms.map((worm) => {
          if (worm.isPlayer) {
            const playerWorm = worm as PlayerWorm
            const head = playerWorm.segments[0]
            const dx = mousePosition.x - head.x
            const dy = mousePosition.y - head.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance > 5) {
              const newDirection = {
                x: (dx / distance) * playerWorm.speed,
                y: (dy / distance) * playerWorm.speed,
              }

              const newHead = {
                x: head.x + newDirection.x,
                y: head.y + newDirection.y,
              }

              const newSegments = [newHead, ...playerWorm.segments.slice(0, -1)]

              return {
                ...playerWorm,
                segments: newSegments,
                direction: newDirection,
              }
            }
            return worm
          } else {
            const decorativeWorm = worm as DecorativeWorm
            return {
              ...decorativeWorm,
              x: (decorativeWorm.x + decorativeWorm.speed) % window.innerWidth,
              y: decorativeWorm.y + Math.sin(Date.now() * 0.001 + decorativeWorm.x * 0.01) * 0.5,
            }
          }
        }),
      )
    }

    const interval = setInterval(animateWorms, 16) // 60 FPS
    return () => {
      clearInterval(interval)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove, mousePosition])

  return (
    <>
      {worms.map((worm) => {
        if (worm.isPlayer) {
          const playerWorm = worm as PlayerWorm
          return playerWorm.segments.map((segment, index) => (
            <div
              key={`${worm.id}-${index}`}
              className={`snake-segment ${worm.color} ${index === 0 ? "snake-head" : ""}`}
              style={{
                left: `${segment.x - 10}px`,
                top: `${segment.y - 10}px`,
                width: `${20 - index * 2}px`,
                height: `${20 - index * 2}px`,
                zIndex: 1000 - index,
              }}
            />
          ))
        } else {
          const decorativeWorm = worm as DecorativeWorm
          return (
            <div
              key={worm.id}
              className={`snake-worm ${worm.color}`}
              style={{
                left: `${decorativeWorm.x}px`,
                top: `${decorativeWorm.y}px`,
                width: `${decorativeWorm.size}px`,
                height: `${decorativeWorm.size}px`,
              }}
            />
          )
        }
      })}
    </>
  )
}
