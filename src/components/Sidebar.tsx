"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Plus, ShieldCheck, Sparkles, Send } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar flex flex-col justify-between">
      <div>
        {/* Brand Logo Header */}
        <div className="sidebar-header flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/20">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Entiix<span className="text-purple-600">.</span>
            </span>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="px-4 pt-5 pb-2">
          <Link 
            href="/dashboard/groups" 
            className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/25 rounded-xl font-semibold"
          >
            <span>Create Group</span>
            <Plus size={18} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <Link 
            href="/dashboard" 
            className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>
          
          <Link 
            href="/dashboard/groups" 
            className={`nav-item ${pathname?.includes("/dashboard/groups") ? "active" : ""}`}
          >
            <Users size={19} />
            <span>Monitoring Groups</span>
          </Link>

          <Link 
            href="/dashboard/telegram" 
            className={`nav-item ${pathname?.includes("/dashboard/telegram") ? "active" : ""}`}
          >
            <Send size={19} />
            <span>Telegram</span>
          </Link>

          <Link 
            href="/dashboard/settings" 
            className={`nav-item ${pathname?.includes("/dashboard/settings") ? "active" : ""}`}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Promo Card & Logout */}
      <div>
        <div className="px-4 mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/80 relative overflow-hidden text-center">
            <div className="w-10 h-10 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Entiix Intelligence</h4>
            <p className="text-xs text-slate-500 mb-3">Real-time competitor ad detection active.</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-white px-3 py-1 rounded-full border border-purple-100 shadow-sm">
              <ShieldCheck size={13} /> Pro Active
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="nav-item w-full text-left text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={19} className="text-red-500" />
            <span className="font-medium text-red-600">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
