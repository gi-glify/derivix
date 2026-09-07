import { useState } from "react";
import { Bell, CheckCheck, ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/store";
import { useNavigate } from "react-router-dom";
import { useDemo } from "@/lib/demo/store";

export function Topbar() {
  const { user, signOut } = useAuth();
  const { notifications, unreadNotifications, markAllNotificationsRead, markNotificationRead } = useDemo();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur dark:border-brand-line dark:bg-brand-ink/95 sm:px-8 sm:py-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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

        <div className="ml-1 min-w-0 sm:ml-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-muted">
            {new Date().toLocaleDateString("en-GB", { 
              weekday: "long", 
              day: "numeric", 
              month: "long", 
              year: "numeric" 
            })}
          </p>
          <h1 className="mt-0.5 max-w-[45vw] truncate text-base font-bold tracking-tight text-brand-ink dark:text-brand-ink sm:max-w-none sm:text-xl">
            Good morning, {user?.user_metadata?.full_name?.split(" ")[0] || "there"}
          </h1>
        </div >
      </div >

      <div className="relative flex items-center gap-2 sm:gap-3">
        <button type="button"
          onClick={() => setNotificationsOpen((value) => !value)}
          aria-label="Notifications" 
          className="relative rounded-full border border-brand-line p-2.5 text-brand-muted transition-all hover:border-brand-lime hover:text-brand-ink dark:border-brand-line dark:text-brand-muted dark:hover:border-brand-lime dark:hover:text-brand-ink"
        >
          <Bell className="h-4 w-4" />{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[9px] font-bold text-white">{Math.min(unreadNotifications, 9)}</span>}
        </button>
        {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-brand-line bg-white shadow-2xl dark:bg-dark-ink"><div className="flex items-center justify-between border-b border-brand-line px-4 py-3"><div><p className="text-sm font-bold text-brand-ink">Notifications</p><p className="text-[10px] text-brand-muted">Realtime market and account activity</p></div><button type="button" onClick={markAllNotificationsRead} className="flex items-center gap-1 text-[10px] font-bold text-brand-limeDeep"><CheckCheck className="h-3.5 w-3.5" />Mark read</button></div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((item) => <button type="button" key={item.id} onClick={() => markNotificationRead(item.id)} className={`block w-full border-b border-brand-line px-4 py-3 text-left hover:bg-brand-canvas ${item.read ? "opacity-60" : ""}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-bold text-brand-ink">{item.title}</span>{!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-lime" />}</div><p className="mt-1 text-[11px] leading-4 text-brand-muted">{item.body}</p><p className="mt-1 text-[10px] text-brand-muted">{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></button>) : <div className="px-4 py-10 text-center text-xs text-brand-muted">No notifications yet. Market updates will appear here.</div>}</div></div>}
        
        <div className="hidden items-center gap-3 border-l border-brand-line pl-4 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lime text-sm font-bold text-brand-ink">
            {user?.user_metadata?.full_name?.split(" ").map((name: string) => name[0]).join("").slice(0, 2) || "AS"}
          </div >
          <div className="text-right">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-ink">{user?.user_metadata?.full_name || "Demo user"}</p>
            <button 
              onClick={async () => { await signOut(); navigate("/"); }}
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
