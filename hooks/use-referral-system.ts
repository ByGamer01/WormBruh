"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface ReferralCode {
  id: string
  user_id: string
  code: string
  created_at: string
}

interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  status: "pending" | "confirmed" | "rewarded"
  reward_points: number
  created_at: string
  confirmed_at: string | null
  profiles: {
    display_name: string | null
    username: string | null
  }
}

interface ReferralReward {
  id: string
  user_id: string
  referral_id: string
  reward_type: "points" | "bonus_lives" | "premium_access"
  reward_value: number
  claimed: boolean
  created_at: string
  claimed_at: string | null
}

interface ReferralStats {
  totalReferrals: number
  confirmedReferrals: number
  pendingRewards: number
  totalRewardsEarned: number
}

export function useReferralSystem() {
  const { user } = useAuth()
  const authenticated = !!user
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    confirmedReferrals: 0,
    pendingRewards: 0,
    totalRewardsEarned: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  const fetchReferralCode = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("referral_codes").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        return
      } else if (data) {
        setReferralCode(data)
      }
    } catch (error) {
      return
    }
  }

  const fetchReferrals = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          profiles!referrals_referred_id_fkey (
            display_name,
            username
          )
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })

      if (!error) {
        setReferrals(data || [])
      }
    } catch (error) {
      return
    }
  }

  const fetchRewards = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error) {
        setRewards(data || [])
      }
    } catch (error) {
      return
    }
  }

  const calculateStats = () => {
    const totalReferrals = referrals.length
    const confirmedReferrals = referrals.filter((r) => r.status === "confirmed" || r.status === "rewarded").length
    const pendingRewards = rewards.filter((r) => !r.claimed).length
    const totalRewardsEarned = rewards.filter((r) => r.claimed).reduce((sum, r) => sum + r.reward_value, 0)

    setStats({
      totalReferrals,
      confirmedReferrals,
      pendingRewards,
      totalRewardsEarned,
    })
  }

  const processReferral = async (referralCodeStr: string) => {
    if (!user) return { success: false, error: "Usuario no autenticado" }

    try {
      const { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", referralCodeStr)
        .single()

      if (codeError || !codeData) {
        return { success: false, error: "Código de referido inválido" }
      }

      if (codeData.user_id === user.id) {
        return { success: false, error: "No puedes usar tu propio código de referido" }
      }

      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", user.id)
        .single()

      if (existingReferral) {
        return { success: false, error: "Ya has sido referido anteriormente" }
      }

      const { error: referralError } = await supabase.from("referrals").insert({
        referrer_id: codeData.user_id,
        referred_id: user.id,
        referral_code: referralCodeStr,
        status: "confirmed",
        reward_points: 100,
        confirmed_at: new Date().toISOString(),
      })

      if (referralError) {
        return { success: false, error: "Error al procesar el referido" }
      }

      await supabase.from("referral_rewards").insert({
        user_id: codeData.user_id,
        referral_id: user.id,
        reward_type: "points",
        reward_value: 100,
        claimed: false,
      })

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: "Error inesperado" }
    }
  }

  const claimReward = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from("referral_rewards")
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", rewardId)
        .eq("user_id", user?.id)

      if (error) {
        return { success: false, error: "Error al reclamar recompensa" }
      }

      await fetchRewards()
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: "Error inesperado" }
    }
  }

  const getReferralLink = () => {
    if (!referralCode) return ""
    return `${window.location.origin}?ref=${referralCode.code}`
  }

  useEffect(() => {
    if (!authenticated || !user) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      await Promise.all([fetchReferralCode(), fetchReferrals(), fetchRewards()])
      setLoading(false)
    }

    loadData()
  }, [authenticated, user])

  useEffect(() => {
    calculateStats()
  }, [referrals, rewards])

  return {
    referralCode,
    referrals,
    rewards,
    stats,
    loading,
    processReferral,
    claimReward,
    getReferralLink,
    refetch: () => {
      setLoading(true)
      Promise.all([fetchReferralCode(), fetchReferrals(), fetchRewards()]).then(() => setLoading(false))
    },
  }
}
