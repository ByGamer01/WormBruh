"use client"

import { useState } from "react"
import { useReferralSystem } from "@/hooks/use-referral-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Share2, Gift, Users, TrendingUp, Award } from "lucide-react"
import { toast } from "sonner"

export function ReferralDashboard() {
  const { referralCode, referrals, rewards, stats, loading, claimReward, getReferralLink } = useReferralSystem()
  const [shareLoading, setShareLoading] = useState(false)

  const copyReferralLink = async () => {
    const link = getReferralLink()
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      toast.success("Enlace copiado al portapapeles")
    } catch (error) {
      toast.error("Error al copiar el enlace")
    }
  }

  const shareReferralLink = async () => {
    const link = getReferralLink()
    if (!link) return

    setShareLoading(true)
    try {
      if (navigator.share) {
        await navigator.share({
          title: "¡Únete al Juego de Puntos!",
          text: "Usa mi código de referido y ambos ganamos puntos extra",
          url: link,
        })
      } else {
        await copyReferralLink()
      }
    } catch (error) {
      console.error("Error sharing:", error)
    } finally {
      setShareLoading(false)
    }
  }

  const handleClaimReward = async (rewardId: string) => {
    const result = await claimReward(rewardId)
    if (result.success) {
      toast.success("Recompensa reclamada exitosamente")
    } else {
      toast.error(result.error || "Error al reclamar recompensa")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Total Referidos</div>
            </div>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="text-sm font-medium text-muted-foreground">Confirmados</div>
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.confirmedReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-yellow-500" />
              <div className="text-sm font-medium text-muted-foreground">Recompensas Pendientes</div>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.pendingRewards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div className="text-sm font-medium text-muted-foreground">Puntos Ganados</div>
            </div>
            <div className="text-2xl font-bold text-purple-500">{stats.totalRewardsEarned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      {referralCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Tu Código de Referido
            </CardTitle>
            <CardDescription>Comparte tu código con amigos y gana puntos por cada referido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralCode.code} readOnly className="font-mono text-lg" />
              <Button onClick={copyReferralLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={getReferralLink()} readOnly className="text-sm" />
              <Button onClick={shareReferralLink} disabled={shareLoading}>
                {shareLoading ? "Compartiendo..." : "Compartir"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cada amigo que se registre con tu código te dará 100 puntos extra
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Referrals and Rewards */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Mis Referidos</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Referidos</CardTitle>
              <CardDescription>Lista de todos los usuarios que has referido</CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aún no has referido a ningún amigo</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comparte tu código de referido para comenzar a ganar puntos
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {referral.profiles.display_name || referral.profiles.username || "Usuario Anónimo"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Referido el {new Date(referral.created_at).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            referral.status === "confirmed" || referral.status === "rewarded" ? "default" : "secondary"
                          }
                        >
                          {referral.status === "confirmed" || referral.status === "rewarded"
                            ? "Confirmado"
                            : "Pendiente"}
                        </Badge>
                        <div className="text-sm font-medium text-primary">+{referral.reward_points} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recompensas Disponibles</CardTitle>
              <CardDescription>Reclama tus recompensas por referir amigos</CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tienes recompensas disponibles</p>
                  <p className="text-sm text-muted-foreground mt-2">Refiere amigos para ganar recompensas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {reward.reward_type === "points"
                            ? "Puntos Extra"
                            : reward.reward_type === "bonus_lives"
                              ? "Vidas Bonus"
                              : "Acceso Premium"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reward.reward_value}{" "}
                          {reward.reward_type === "points"
                            ? "puntos"
                            : reward.reward_type === "bonus_lives"
                              ? "vidas"
                              : "días"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Creado el {new Date(reward.created_at).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                      <div>
                        {reward.claimed ? (
                          <Badge variant="outline">Reclamado</Badge>
                        ) : (
                          <Button onClick={() => handleClaimReward(reward.id)} size="sm">
                            Reclamar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
