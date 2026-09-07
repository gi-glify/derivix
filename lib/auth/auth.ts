export type AuthUser = { id: string; fullName: string; email: string };
export type StoredUser = AuthUser & { password: string };

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function validateRegistration(input: { fullName: string; email: string; password: string; confirmPassword: string }) {
  if (input.fullName.trim().length < 2) return "Enter your full name.";
  if (!normalizeEmail(input.email).includes("@")) return "Enter a valid email address.";
  if (input.password.length < 8) return "Password must be at least 8 characters.";
  if (input.password !== input.confirmPassword) return "Passwords do not match.";
  return null;
}

export function validateLogin(email: string, password: string) {
  if (!normalizeEmail(email).includes("@")) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  return null;
}
