import { Navigate, useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/auth-page";
import { useAuth } from "@/lib/auth/store";

export default function RegisterPage() { const { user, register } = useAuth(); const navigate = useNavigate(); if (user) return <Navigate to="/app" replace />; return <AuthPage mode="register" onSubmit={(input) => { const error = register(input); if (!error) navigate("/app"); return error; }} />; }
