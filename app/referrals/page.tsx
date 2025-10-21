"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { ReferralDashboard } from "@/components/referral/referral-dashboard"
import { ReferralInput } from "@/components/referral/referral-input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ReferralsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Sistema de Referidos</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Inicio</Link>
              </Button>
              <Button asChild>
                <Link href="/game">Jugar</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <ReferralInput />
            <ReferralDashboard />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
