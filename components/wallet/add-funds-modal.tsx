"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/use-wallet"

interface AddFundsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddFundsModal({ isOpen, onClose }: AddFundsModalProps) {
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { addFunds } = useWallet()

  const handleAddFunds = async () => {
    const numAmount = Number.parseFloat(amount)
    if (numAmount <= 0 || numAmount > 1000) return

    setIsProcessing(true)
    const success = await addFunds(numAmount)

    if (success) {
      setAmount("")
      onClose()
    }
    setIsProcessing(false)
  }

  const quickAmounts = [10, 25, 50, 100]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Agregar Fondos
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Cantidad (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="1000"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="text-sm"
              >
                ${quickAmount}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            • Mínimo: $1.00 • Máximo: $1,000.00 • Los fondos se agregan instantáneamente
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={handleAddFunds}
              disabled={!amount || Number.parseFloat(amount) <= 0 || isProcessing}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {isProcessing ? "Procesando..." : "Agregar Fondos"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
