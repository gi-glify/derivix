import type { Session, User } from "@supabase/supabase-js";

export function userFromSession(session: Session | null): User | null {
  return session?.user ?? null;
}
