import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ label = "Password", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="password-field"><input {...props} id={id} type={visible ? "text" : "password"} className="auth-input" /><button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>;
}
