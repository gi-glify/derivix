import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth/store";

export function ProtectedRoute() { const { user, loading } = useAuth(); if (loading) return <div className="flex min-h-screen items-center justify-center bg-brand-canvas"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-line border-t-brand-lime" /></div>; return user ? <Outlet /> : <Navigate to="/auth/login" replace />; }
