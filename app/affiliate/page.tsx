"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { usePrivy } from "@privy-io/react-auth"

export default function AffiliatePage() {
  const [referralCode, setReferralCode] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingRewards: 0,
  })
  const { user } = usePrivy()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    if (!user) return

    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single()

      if (profile) {
        setReferralCode(profile.referral_code)
      }

      const { data: stats } = await supabase.from("referrals").select("*").eq("referrer_id", user.id)

      if (stats) {
        setReferralStats({
          totalReferrals: stats.length,
          totalEarnings: stats.reduce((sum, ref) => sum + (ref.rewards_earned || 0), 0),
          pendingRewards: stats.reduce((sum, ref) => sum + (ref.pending_rewards || 0), 0),
        })
      }
    } catch (error) {
      console.error("Error loading referral data:", error)
    }
  }

  const copyReferralLink = () => {
    const link = `${baseUrl}?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    alert("Referral link copied!")
  }

  const referralLink = baseUrl ? `${baseUrl}?ref=${referralCode}` : "Loading..."

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            DAMN<span className="text-primary">BRUH</span> Affiliate Program
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Total Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{referralStats.totalReferrals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">${referralStats.totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Pending Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">${referralStats.pendingRewards.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="flex-1" />
                <Button onClick={copyReferralLink} disabled={!baseUrl}>
                  Copy Link
                </Button>
              </div>
              <p className="text-muted-foreground mt-2">Share this link to earn 10% of your referrals' winnings!</p>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button asChild>
              <a href="/">Back to Game</a>
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
