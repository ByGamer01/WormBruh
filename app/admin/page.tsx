"use client"

import { WormBruhGame } from "@/components/game/wormbruh-game"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"

export default function AdminPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedBet, setSelectedBet] = useState(1)

  const handleExit = (earnings: number) => {
    setIsPlaying(false)
  }

  if (isPlaying) {
    return <WormBruhGame betAmount={selectedBet} onExit={handleExit} />
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Navigation */}
      <nav className="absolute top-4 left-4 z-50">
        <Button asChild variant="outline" size="sm">
          <Link href="/">← Volver al Inicio</Link>
        </Button>
      </nav>

      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🎮 Admin Mode - <span className="text-green-400">WormBruh</span>
        </h1>
        <p className="text-gray-400 mb-8">Prueba el juego completo estilo DamnBruh sin necesidad de fondos reales</p>

        <div className="bg-gray-900 rounded-xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Selecciona apuesta de prueba:</h2>

          <div className="flex gap-4 justify-center mb-6">
            {[1, 5, 20].map((amount) => (
              <Button
                key={amount}
                onClick={() => setSelectedBet(amount)}
                className={`px-6 py-3 text-lg ${
                  selectedBet === amount ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                ${amount}
              </Button>
            ))}
          </div>

          <Button onClick={() => setIsPlaying(true)} className="w-full bg-green-500 hover:bg-green-600 text-xl py-6">
            🐍 INICIAR JUEGO DE PRUEBA
          </Button>

          <div className="mt-6 text-left text-sm text-gray-400 space-y-2">
            <p>
              <span className="text-white">🖱️ Mouse:</span> Mover serpiente
            </p>
            <p>
              <span className="text-white">🖱️ Click:</span> Boost (consume longitud)
            </p>
            <p>
              <span className="text-white">⌨️ Mantener Q:</span> Salir seguro y conservar ganancias
            </p>
            <p>
              <span className="text-white">💀 Colisión:</span> Pierdes tu apuesta
            </p>
            <p>
              <span className="text-white">🎯 Matar serpientes:</span> Ganas su valor (-10% fee)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
