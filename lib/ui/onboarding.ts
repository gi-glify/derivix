export type OnboardingStep = { title: string; description: string; href?: string };

export const onboardingSteps: OnboardingStep[] = [
  { title: "Welcome to Derivix", description: "This quick tour shows you where to monitor markets, practise trades, and manage your account." },
  { title: "Your overview", description: "Track balance, open positions, recent activity, and portfolio performance from one workspace.", href: "/app" },
  { title: "Markets", description: "Explore live-style simulated prices, interactive charts, moving averages, volume, and market details.", href: "/app/markets" },
  { title: "Trade", description: "Switch between chart modes, review the risk warning, and submit a simulated buy or sell order.", href: "/app/trade" },
  { title: "Wallet and account", description: "Use the wallet, verification, profile, and notification tools from the navigation.", href: "/app/deposit" },
];
