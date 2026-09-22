import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { DemoProvider } from "@/lib/demo/store";
import { Outlet, useLocation } from "react-router-dom";
import { MobileNav } from "@/components/app/mobile-nav";

export default function AppLayout() {
  const binary = useLocation().pathname === '/app/binary';
  return <DemoProvider><div className={"relative flex min-h-screen min-w-0 max-w-full overflow-x-clip bg-[#f7f9f6] transition-colors dark:bg-[#111512] " + (binary ? 'binary-workspace' : '')}><Sidebar /><div className="min-w-0 max-w-full flex-1 pb-28 pt-[72px] sm:pb-24 sm:pt-[80px] lg:ml-64 lg:pb-0 lg:pt-[88px]"><Topbar /><Outlet /></div><MobileNav /></div></DemoProvider>;
}
