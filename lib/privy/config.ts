export const privyConfig = {
  appId: "cmf8haz92005tl80bsg0fikx8",
  clientSecret: "37966LRkqQ3Zbox8LhvxS4Kyit5yUqk2zzWN5BgQJCUP7kAxSFVSTXzqcmCefLGpdfm6qB2fagt6qcNWrbzo7N14",
  config: {
    loginMethods: ["wallet", "email", "sms"],
    appearance: {
      theme: "dark",
      accentColor: "#fbbf24",
      logo: "/logo.png",
    },
    embeddedWallets: {
      createOnLogin: "users-without-wallets",
    },
    supportedChains: ["ethereum", "polygon", "base"],
  },
}
