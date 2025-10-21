"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  const { login, authenticated, logout, user } = usePrivy()

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Hola, {user?.email?.address || "Usuario"}</span>
        <Button variant="outline" onClick={logout}>
          Cerrar Sesión
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={login} className="bg-primary hover:bg-primary/90">
      Iniciar Sesión
    </Button>
  )
}
