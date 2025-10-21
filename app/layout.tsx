import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { PrivyProviderWrapper } from "@/components/providers/privy-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DAMNBRUH - Skill-Based Betting",
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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <PrivyProviderWrapper>
          <Suspense fallback={null}>{children}</Suspense>
        </PrivyProviderWrapper>
        <Analytics />
      </body>
    </html>
  )
}
