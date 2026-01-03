"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const authenticated = !!user
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!authenticated || !user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchOrCreateProfile = async () => {
      try {
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (existingProfile) {
          setProfile(existingProfile)
        } else if (fetchError?.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: `user_${user.id.slice(0, 8)}`,
              display_name: user.email?.split("@")[0] || "Usuario",
            })
            .select()
            .single()

          if (!createError) {
            setProfile(newProfile)
          }
        }
      } catch (error) {
        // Silent error
      } finally {
        setLoading(false)
      }
    }

    fetchOrCreateProfile()
  }, [authenticated, user, supabase])

  return { profile, loading, refetch: () => setLoading(true) }
}
