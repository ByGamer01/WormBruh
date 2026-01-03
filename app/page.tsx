"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SnakeWorms } from "@/components/game/snake-worms"
import { WormBruhGame } from "@/components/game/wormbruh-game"
import { AddFundsModal } from "@/components/wallet/add-funds-modal"
import { useState } from "react"
import { useGameData } from "@/hooks/use-game-data"
import { useWallet } from "@/hooks/use-wallet"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [selectedBet, setSelectedBet] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const { leaderboard, globalStats } = useGameData()
  const { wallet, placeBet } = useWallet()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const authenticated = !!user

  const handleJoinGame = async () => {
    if (!authenticated) {
      router.push("/auth/login")
      return
    }

    if (wallet.balance < selectedBet) {
      setShowAddFunds(true)
      return
    }

    const betSuccess = await placeBet(selectedBet)
    if (betSuccess) {
      setIsPlaying(true)
    }
  }

  const handleExitGame = (earnings: number) => {
    setIsPlaying(false)
  }

  const getUserDisplayName = () => {
    if (!user?.email) return "Usuario"
    try {
      return user.email.split("@")[0]
    } catch (error) {
      return "Usuario"
    }
  }

  if (isPlaying) {
    return <WormBruhGame betAmount={selectedBet} onExit={handleExitGame} />
  }

  return (
    <div className="wormbruh-container">
      <SnakeWorms />

      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">🐍</span>
            </div>
            <span className="text-primary font-bold">
              {authenticated ? `¡Hola, ${getUserDisplayName()}!` : "Bienvenido, bruh!"}
            </span>
          </div>
          {authenticated ? (
            <Button onClick={() => signOut()} className="bg-destructive hover:bg-destructive/90">
              Cerrar Sesión
            </Button>
          ) : (
            <Button onClick={() => router.push("/auth/login")} className="bg-primary hover:bg-primary/90">
              Iniciar Sesión
            </Button>
          )}
        </div>
      </header>

      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-6xl font-black text-white tracking-wider">
          WORM<span className="text-primary">BRUH</span>
        </h1>
        <p className="text-primary text-lg font-bold tracking-widest mt-2">SNAKE BATTLE ROYALE</p>
      </div>

      <div className="absolute left-4 top-1/4 w-80 z-10">
        <Card className="leaderboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-primary">🏆</span>
              <h3 className="text-white font-bold">Leaderboard</h3>
              <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs">Live</span>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((player, index) => (
                <div key={player.username} className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {index + 1}. {player.username}
                  </span>
                  <span className="text-primary font-bold">${player.winnings.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-transparent border border-border text-white hover:bg-border/20">
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>

        <Card className="leaderboard-card mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">👥</span>
                <h3 className="text-white font-bold">Friends</h3>
              </div>
              <span className="text-muted-foreground text-sm">0 playing</span>
            </div>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-muted-foreground">👤</span>
              </div>
              <p className="text-muted-foreground text-sm">No friends... add some!</p>
            </div>
            <Button className="w-full bg-transparent border border-border text-white hover:bg-border/20">
              Add Friends
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground text-2xl">🐍</span>
          </div>
          <p className="text-muted-foreground">
            {authenticated ? "¡Listo para la batalla!" : "Inicia sesión para jugar"}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          {[1, 5, 20].map((amount) => (
            <Button
              key={amount}
              onClick={() => setSelectedBet(amount)}
              disabled={!authenticated || wallet.balance < amount}
              className={`bet-button ${selectedBet === amount ? "bg-primary" : "bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground"} ${!authenticated || wallet.balance < amount ? "opacity-50" : ""}`}
            >
              ${amount}
            </Button>
          ))}
        </div>

        <Button
          className="join-game-button mb-6"
          onClick={handleJoinGame}
          disabled={authenticated && wallet.balance < selectedBet}
        >
          <span className="text-2xl">🐍</span>
          {!authenticated
            ? "INICIAR SESIÓN PARA JUGAR"
            : wallet.balance < selectedBet
              ? "FONDOS INSUFICIENTES"
              : "JUGAR SNAKE BATTLE"}
        </Button>

        <div className="flex gap-4 mb-8">
          <Button className="bg-transparent border border-border text-white hover:bg-border/20 px-6">🌍 US</Button>
          <Button className="bg-transparent border border-border text-white hover:bg-border/20 px-6">
            ☰ Browse Lobbies
          </Button>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-white">{globalStats.playersInGame}</div>
            <div className="text-muted-foreground text-sm">Players in Game</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">${globalStats.totalWinnings.toLocaleString()}</div>
            <div className="text-muted-foreground text-sm">Global Player Winnings</div>
          </div>
        </div>

        <Button className="join-game-button mt-8 bg-primary hover:bg-primary/90" asChild>
          <a href="/affiliate">👥 Manage Affiliate</a>
        </Button>
      </div>

      <div className="absolute right-4 top-1/4 w-80 z-10">
        <Card className="wallet-display">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-accent">💰</span>
                <h3 className="text-white font-bold">Wallet</h3>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-muted-foreground">
                  🔄 Actualizar
                </Button>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary">
                ${authenticated ? wallet.balance.toFixed(2) : "0.00"}
              </div>
              <div className="text-muted-foreground text-sm">Balance disponible</div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={() => (authenticated ? setShowAddFunds(true) : router.push("/auth/login"))}
              >
                {authenticated ? "Agregar Fondos" : "Iniciar Sesión"}
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!authenticated || wallet.balance <= 0}>
                Retirar
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400">🎨</span>
                <h4 className="text-white font-bold">Customize</h4>
              </div>
              <Button className="w-full bg-transparent border border-border text-white hover:bg-border/20">
                Change Appearance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">💬 Join Discord!</Button>
      </div>

      <AddFundsModal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} />
    </div>
  )
}
