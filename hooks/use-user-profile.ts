"use client"

import { usePrivy } from "@privy-io/react-auth"
import { createClient } from "@/lib/supabase/client"
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
  const { user, authenticated } = usePrivy()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!authenticated || !user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchOrCreateProfile = async () => {
      try {
        // Primero intentamos obtener el perfil existente
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (existingProfile) {
          setProfile(existingProfile)
        } else if (fetchError?.code === "PGRST116") {
          // El perfil no existe, lo creamos
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: `user_${user.id.slice(0, 8)}`,
              display_name: user.email?.address?.split("@")[0] || "Usuario",
            })
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
          } else {
            setProfile(newProfile)
          }
        } else {
          console.error("Error fetching profile:", fetchError)
        }
      } catch (error) {
        console.error("Error in fetchOrCreateProfile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrCreateProfile()
  }, [authenticated, user, supabase])

  return { profile, loading, refetch: () => setLoading(true) }
}
