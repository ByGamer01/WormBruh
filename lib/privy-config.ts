import type { PrivyClientConfig } from "@privy-io/react-auth"

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email"], // Solo email, sin wallets
  appearance: {
    theme: "dark",
    accentColor: "#059669",
    showWalletLoginFirst: false,
  },
  mfa: {
    noPromptOnMfaRequired: false,
  },
  embeddedWallets: {
    createOnLogin: "off",
  },
  externalWallets: {
    coinbaseWallet: {
      connectionOptions: "eoaOnly",
    },
    metamask: {
      connectionOptions: "eoaOnly",
    },
  },
}
