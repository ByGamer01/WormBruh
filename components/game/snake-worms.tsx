"use client"

import { useEffect, useState } from "react"

interface DecorativeWorm {
  id: string
  x: number
  y: number
  size: number
  color: string
  speed: number
  angle: number
}

export function SnakeWorms() {
  const [worms, setWorms] = useState<DecorativeWorm[]>([])

  useEffect(() => {
    const initialWorms: DecorativeWorm[] = [
      {
        id: "blue-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 80,
        color: "snake-blue",
        speed: 0.3,
        angle: Math.random() * Math.PI * 2,
      },
      {
        id: "pink-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 50,
        color: "snake-pink",
        speed: 0.7,
        angle: Math.random() * Math.PI * 2,
      },
      {
        id: "green-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 60,
        color: "snake-green",
        speed: 0.5,
        angle: Math.random() * Math.PI * 2,
      },
      {
        id: "purple-1",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 70,
        color: "snake-purple",
        speed: 0.4,
        angle: Math.random() * Math.PI * 2,
      },
    ]

    setWorms(initialWorms)

    const animateWorms = () => {
      setWorms((prevWorms) =>
        prevWorms.map((worm) => {
          let newX = worm.x + Math.cos(worm.angle) * worm.speed
          let newY = worm.y + Math.sin(worm.angle) * worm.speed
          let newAngle = worm.angle

          // Rebotar en los bordes
          if (newX < 0 || newX > window.innerWidth) {
            newAngle = Math.PI - worm.angle
            newX = Math.max(0, Math.min(window.innerWidth, newX))
          }
          if (newY < 0 || newY > window.innerHeight) {
            newAngle = -worm.angle
            newY = Math.max(0, Math.min(window.innerHeight, newY))
          }

          // Cambio aleatorio de dirección ocasional
          if (Math.random() < 0.01) {
            newAngle += (Math.random() - 0.5) * 0.5
          }

          return {
            ...worm,
            x: newX,
            y: newY,
            angle: newAngle,
          }
        }),
      )
    }

    const interval = setInterval(animateWorms, 16) // 60 FPS
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      {worms.map((worm) => (
        <div
          key={worm.id}
          className={`snake-worm ${worm.color}`}
          style={{
            left: `${worm.x}px`,
            top: `${worm.y}px`,
            width: `${worm.size}px`,
            height: `${worm.size}px`,
          }}
        />
      ))}
    </>
  )
}
