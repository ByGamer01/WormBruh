"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { login, authenticated } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (authenticated) {
      router.push("/")
    }
  }, [authenticated, router])

  const handleLogin = () => {
    login()
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground text-2xl">🐍</span>
              </div>
              <CardTitle className="text-2xl text-white">
                DAMN<span className="text-primary">BRUH</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Inicia sesión para jugar Snake Battle Royale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <Button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  🚀 Iniciar Sesión con Email
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>• Solo necesitas tu email para empezar</p>
                  <p>• Agrega fondos para apostar y ganar</p>
                  <p>• Compite contra jugadores reales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
