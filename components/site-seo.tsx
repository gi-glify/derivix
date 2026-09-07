import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const pages: Record<string, { title: string; description: string }> = {
  "/": { title: "Derivix — Trade beyond limits", description: "A focused trading workspace for monitoring markets, managing funds, and building disciplined execution habits." },
  "/auth/login": { title: "Sign in | Derivix", description: "Securely sign in to your Derivix trading workspace." },
  "/auth/register": { title: "Create your account | Derivix", description: "Create a Derivix account and start exploring your trading workspace." },
  "/app": { title: "Portfolio dashboard | Derivix", description: "Review portfolio balance, positions, market activity, and account transactions." },
  "/app/markets": { title: "Markets | Derivix", description: "Inspect interactive market charts, price action, volume, and order details." },
  "/app/trade": { title: "Trade | Derivix", description: "Review market price action and manage orders from the Derivix trading screen." },
  "/app/deposit": { title: "Add funds | Derivix", description: "Add funds to your Derivix wallet through the configured payment provider." },
  "/app/withdraw": { title: "Withdraw funds | Derivix", description: "Request a wallet withdrawal and review its account status." },
  "/app/positions": { title: "Positions | Derivix", description: "Review and manage open and closed trading positions." },
  "/app/transactions": { title: "Transactions | Derivix", description: "Review your deposits, withdrawals, and trading ledger activity." },
  "/app/profile": { title: "Profile settings | Derivix", description: "Manage your Derivix account and contact details." },
  "/app/kyc": { title: "Identity verification | Derivix", description: "Submit and review identity verification details for your account." },
  "/privacy": { title: "Privacy policy | Derivix", description: "Read how Derivix handles account, payment, and platform data." },
  "/terms": { title: "Terms of service | Derivix", description: "Review the terms that govern use of the Derivix platform." },
  "/trading-policy": { title: "Trading policy and risk warning | Derivix", description: "Understand trading risks, account safeguards, and the limits of simulated market activity." },
  "/thank-you": { title: "Thank you | Derivix", description: "Your Derivix request was received." },
};

export function SiteSeo() {
  const { pathname } = useLocation();
  const page = pages[pathname] ?? { title: "Page not found | Derivix", description: "The requested Derivix page could not be found." };
  const domain = String(import.meta.env.VITE_APP_DOMAIN ?? "derivix.com").replace(/^https?:\/\//, "");
  const siteUrl = `https://${domain}`;
  const imageUrl = `${siteUrl}/derivix-logo.png`;

  return <Helmet>
    <html lang="en" />
    <title>{page.title}</title>
    <meta name="description" content={page.description} />
    <link rel="canonical" href={`${siteUrl}${pathname}`} />
    <meta property="og:site_name" content="Derivix" />
    <meta property="og:title" content={page.title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={`${siteUrl}${pathname}`} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:image:alt" content="Derivix trading workspace" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={page.title} />
    <meta name="twitter:description" content={page.description} />
    <meta name="twitter:image" content={imageUrl} />
  </Helmet>;
}
