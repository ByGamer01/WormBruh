"use client"

import type React from "react"

import { useState } from "react"
import { useReferralSystem } from "@/hooks/use-referral-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ReferralInput() {
  const { processReferral } = useReferralSystem()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    try {
      const result = await processReferral(code.trim().toUpperCase())
      if (result.success) {
        toast.success("¡Código de referido aplicado exitosamente! Has ganado puntos extra.")
        setCode("")
      } else {
        toast.error(result.error || "Error al procesar el código")
      }
    } catch (error) {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Tienes un Código de Referido?</CardTitle>
        <CardDescription>Ingresa el código de un amigo para ganar puntos extra</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-code">Código de Referido</Label>
            <Input
              id="referral-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC12345"
              className="font-mono"
              maxLength={8}
            />
          </div>
          <Button type="submit" disabled={loading || !code.trim()} className="w-full">
            {loading ? "Procesando..." : "Aplicar Código"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
