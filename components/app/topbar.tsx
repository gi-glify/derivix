import { Bell, ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/store";
import { useNavigate } from "react-router-dom";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-brand-line bg-white px-5 py-4 dark:border-brand-line dark:bg-brand-ink sm:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Controls Group */}
        <div className="flex items-center gap-2 lg:hidden">
          <button 
            aria-label="Open menu" 
            className="rounded-full p-2 text-brand-muted hover:bg-brand-canvas transition-colors active:scale-90"
          >
            <Menu className="h-5 w-5" />
          </button>
          <ThemeToggle />
        </div >
        
        <div className="hidden lg:block">
          <ThemeToggle />
        </div >

        <div className="ml-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-muted">
            {new Date().toLocaleDateString("en-GB", { 
              weekday: "long", 
              day: "numeric", 
              month: "long", 
              year: "numeric" 
            })}
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-brand-ink dark:text-brand-ink">
            Good morning, {user?.fullName.split(" ")[0] || "there"}
          </h1>
        </div >
      </div >

      <div className="flex items-center gap-3">
        <button 
          aria-label="Notifications" 
          className="rounded-full border border-brand-line p-2.5 text-brand-muted transition-all hover:border-brand-lime hover:text-brand-ink dark:border-brand-line dark:text-brand-muted dark:hover:border-brand-lime dark:hover:text-brand-ink"
        >
          <Bell className="h-4 w-4" />
        </button>
        
        <div className="hidden items-center gap-3 border-l border-brand-line pl-4 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lime text-sm font-bold text-brand-ink">
            {user?.fullName.split(" ").map((name) => name[0]).join("").slice(0, 2) || "AS"}
          </div >
          <div className="text-right">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-ink">{user?.fullName || "Demo user"}</p>
            <button 
              onClick={() => { logout(); navigate("/"); }} 
              className="text-[11px] font-bold text-brand-muted hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div >
          <ChevronDown className="h-4 w-4 text-brand-muted" />
        </div >
      </div >
    </header>
  );
}
