"use client"

import type React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">¡Bienvenido al Juego!</CardTitle>
            <CardDescription>Inicia sesión para comenzar a jugar y ganar puntos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Iniciar Sesión
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Al iniciar sesión, aceptas nuestros términos y condiciones
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
