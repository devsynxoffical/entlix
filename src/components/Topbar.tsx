"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, Bell, ChevronDown, Menu, X, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Topbar({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  const userName = session?.user?.name || "Entiix User";
  const userEmail = session?.user?.email || "user@entiix.com";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <header className="topbar">
      {/* Mobile Hamburger Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ads, competitors, keywords..." 
            className="w-full pr-4 py-2 bg-slate-100/70 border border-slate-200/80 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* User & Notifications */}
      <div className="flex items-center gap-4 relative">
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>
        
        <div 
          onClick={() => setShowDropdown(v => !v)}
          className="flex items-center gap-3 cursor-pointer group select-none relative"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">
              {userName}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {userEmail}
            </span>
          </div>
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />

          {/* User Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
              </div>
              <Link 
                href="/dashboard/settings" 
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
              >
                <Settings size={15} />
                <span>Account Settings</span>
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
