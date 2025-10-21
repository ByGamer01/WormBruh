"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface Target {
  id: string
  x: number
  y: number
  size: number
  points: number
}

interface GameAreaProps {
  gameSession: any
  onGameEnd: (score: number) => void
}

export function GameArea({ gameSession, onGameEnd }: GameAreaProps) {
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)

  const generateTarget = useCallback(() => {
    const target: Target = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      size: Math.random() * 30 + 20,
      points: Math.floor(Math.random() * 50) + 10,
    }
    return target
  }, [])

  const hitTarget = useCallback((targetId: string) => {
    setTargets((prev) => {
      const target = prev.find((t) => t.id === targetId)
      if (target) {
        setScore((s) => s + target.points)
      }
      return prev.filter((t) => t.id !== targetId)
    })
  }, [])

  useEffect(() => {
    if (gameSession?.status === "playing") {
      setIsPlaying(true)
      setScore(0)
      setTimeLeft(30)
    }
  }, [gameSession])

  useEffect(() => {
    if (!isPlaying) return

    const gameTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false)
          onGameEnd(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    const targetGenerator = setInterval(() => {
      if (targets.length < 3) {
        setTargets((prev) => [...prev, generateTarget()])
      }
    }, 1500)

    const targetCleaner = setInterval(() => {
      setTargets((prev) => prev.slice(-5))
    }, 3000)

    return () => {
      clearInterval(gameTimer)
      clearInterval(targetGenerator)
      clearInterval(targetCleaner)
    }
  }, [isPlaying, targets.length, generateTarget, onGameEnd, score])

  if (!isPlaying && gameSession?.status !== "playing") {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="relative w-full h-full">
        <div className="absolute top-4 left-4 z-10 text-white">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-xl">Time: {timeLeft}s</div>
          <div className="text-lg">Bet: ${gameSession?.bet_amount}</div>
        </div>

        {targets.map((target) => (
          <button
            key={target.id}
            className="absolute bg-primary rounded-full hover:bg-primary/80 transition-all duration-200 flex items-center justify-center text-white font-bold cursor-pointer"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.size}px`,
              height: `${target.size}px`,
            }}
            onClick={() => hitTarget(target.id)}
          >
            {target.points}
          </button>
        ))}

        {!isPlaying && gameSession?.status === "finished" && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-2xl mb-2">Final Score: {gameSession.score}</p>
              <p className="text-xl mb-4">
                {gameSession.winnings > 0 ? `You won $${gameSession.winnings}!` : "Better luck next time!"}
              </p>
              <Button onClick={() => window.location.reload()}>Play Again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
