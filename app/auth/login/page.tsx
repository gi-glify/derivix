import { Navigate, useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/auth-page";
import { useAuth } from "@/lib/auth/store";

export default function LoginPage() { const { user, login } = useAuth(); const navigate = useNavigate(); if (user) return <Navigate to="/app" replace />; return <AuthPage mode="login" onSubmit={({ email, password }) => { const error = login(email, password); if (!error) navigate("/app"); return error; }} />; }
