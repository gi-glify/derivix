import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { DemoProvider } from "@/lib/demo/store";
import { Outlet } from "react-router-dom";
import { MobileNav } from "@/components/app/mobile-nav";

export default function AppLayout() {
  return <DemoProvider><div className="flex min-h-screen bg-[#f7f9f6] transition-colors dark:bg-[#111512]"><Sidebar /><div className="min-w-0 flex-1 pb-28 sm:pb-24 lg:pb-0"><Topbar /><Outlet /></div><MobileNav /></div></DemoProvider>;
}
