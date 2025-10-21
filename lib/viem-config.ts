import { createPublicClient, createWalletClient, custom, http } from "viem"
import { mainnet, sepolia } from "viem/chains"

// Configuración de cadenas soportadas
export const supportedChains = [mainnet, sepolia]

// Cliente público para lectura de blockchain
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// Función para crear cliente de wallet con provider de Privy
export function createViemWalletClient(ethereumProvider: any) {
  return createWalletClient({
    chain: mainnet,
    transport: custom(ethereumProvider),
  })
}

// Configuración de red por defecto
export const defaultChain = mainnet
