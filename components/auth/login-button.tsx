"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function LoginButton() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Hola, {user.email || "Usuario"}</span>
        <Button variant="outline" onClick={() => signOut()}>
          Cerrar Sesión
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => router.push("/auth/login")} className="bg-primary hover:bg-primary/90">
      Iniciar Sesión
    </Button>
  )
}
