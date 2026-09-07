import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../app/page";
import AppLayout from "../app/app/layout";
import DashboardPage from "../app/app/page";
import DepositPage from "../app/app/deposit/page";
import TradePage from "../app/app/trade/page";
import MarketsPage from "../app/app/markets/page";
import PositionsPage from "../app/app/positions/page";
import TransactionsPage from "../app/app/transactions/page";
import WithdrawPage from "../app/app/withdraw/page";
import KycPage from "../app/app/kyc/page";
import ProfilePage from "../app/app/profile/page";
import AdminPage from "../app/admin/page";
import LoginPage from "../app/auth/login/page";
import RegisterPage from "../app/auth/register/page";
import NotFoundPage from "../app/pages/not-found/page";
import PrivacyPage from "../app/pages/privacy/page";
import TermsPage from "../app/pages/terms/page";
import ThankYouPage from "../app/pages/thank-you/page";
import TradingPolicyPage from "../app/pages/trading-policy/page";
import { Chatbot } from "@/components/assistant/chatbot";
import { AOSController } from "@/components/aos-controller";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AuthProvider, useAuth } from "@/lib/auth/store";
import { ThemeProvider } from "@/lib/ui/theme";

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-brand-canvas"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-line border-t-brand-lime" /></div>;
  if (user) return <Navigate to="/app" replace />;
  return <LandingPage />;
}

export default function App() {
  return <ThemeProvider><AuthProvider><AOSController /><Routes><Route path="/" element={<RootRoute />} /><Route path="/auth/login" element={<LoginPage />} /><Route path="/auth/register" element={<RegisterPage />} /><Route path="/privacy" element={<PrivacyPage />} /><Route path="/terms" element={<TermsPage />} /><Route path="/trading-policy" element={<TradingPolicyPage />} /><Route path="/thank-you" element={<ThankYouPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/app" element={<DashboardPage />} /><Route path="/app/deposit" element={<DepositPage />} /><Route path="/app/markets" element={<MarketsPage />} /><Route path="/app/trade" element={<TradePage />} /><Route path="/app/positions" element={<PositionsPage />} /><Route path="/app/transactions" element={<TransactionsPage />} /><Route path="/app/withdraw" element={<WithdrawPage />} /><Route path="/app/kyc" element={<KycPage />} /><Route path="/app/profile" element={<ProfilePage />} /><Route path="/admin" element={<AdminPage />} /></Route></Route><Route path="*" element={<NotFoundPage />} /></Routes><Chatbot /></AuthProvider></ThemeProvider>;
}
