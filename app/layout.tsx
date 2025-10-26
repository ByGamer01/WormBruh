import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "WormBruh - Skill-Based Betting",
  description: "Juego de habilidad con apuestas y sistema de referidos",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
