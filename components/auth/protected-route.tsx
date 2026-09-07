import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth/store";

export function ProtectedRoute() { const { user } = useAuth(); return user ? <Outlet /> : <Navigate to="/auth/login" replace />; }
