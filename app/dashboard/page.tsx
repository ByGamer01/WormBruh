"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { RecentGames } from "@/components/dashboard/recent-games"
import { AchievementsDisplay } from "@/components/dashboard/achievements-display"
import { ProfileSettings } from "@/components/dashboard/profile-settings"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Mi Dashboard</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Inicio</Link>
              </Button>
              <Button asChild>
                <Link href="/game">Jugar</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Overview */}
            <StatsOverview />

            {/* Tabs */}
            <Tabs defaultValue="games" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="games">Historial de Juegos</TabsTrigger>
                <TabsTrigger value="achievements">Logros</TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
              </TabsList>

              <TabsContent value="games" className="space-y-6">
                <RecentGames />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <AchievementsDisplay />
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <ProfileSettings />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
