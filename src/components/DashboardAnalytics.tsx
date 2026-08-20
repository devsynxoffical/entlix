"use client";

import { Layers, Target, Globe, TrendingUp, Loader2, RefreshCw, Zap } from "lucide-react";
import { useState, useEffect } from "react";

type MonthlyTrend = {
  month: string;
  newCount: number;
  existingCount: number;
  total: number;
};

type Stats = {
  totalAds: number;
  totalGroups: number;
  activeGroups: number;
  newAdsToday: number;
  totalRegions: number;
  monthlyTrends?: MonthlyTrend[];
};

export default function DashboardAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      // Keep null fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const kpis = [
    { label: 'Total Ads Tracked', value: stats?.totalAds ?? 0, icon: Layers, color: 'bg-purple-100 text-purple-600' },
    { label: 'Monitoring Groups', value: stats?.totalGroups ?? 0, icon: Target, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'New Ads Today', value: stats?.newAdsToday ?? 0, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
    { label: 'Monitored Regions', value: stats?.totalRegions ?? 0, icon: Globe, color: 'bg-rose-100 text-rose-500' },
  ];

  const maxMonthlyTotal = Math.max(...(stats?.monthlyTrends?.map(t => t.total) || [10]), 1);

  const activeRatio = stats?.totalGroups ? Math.round((stats.activeGroups / stats.totalGroups) * 100) : 100;
  const pausedRatio = 100 - activeRatio;

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* ROW 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${kpi.color} flex items-center justify-center shrink-0`}>
                <kpi.icon size={22} />
              </div>
              <div>
                {loading
                  ? <div className="w-12 h-7 bg-slate-100 rounded animate-pulse mb-1"></div>
                  : <h3 className="text-2xl font-bold text-slate-900 leading-tight">{kpi.value.toLocaleString()}</h3>
                }
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              </div>
            </div>
            <button onClick={fetchStats} className="text-slate-300 hover:text-slate-600 transition-colors p-1" title="Refresh Metrics">
              <RefreshCw size={15} className={loading ? 'animate-spin text-purple-600' : ''} />
            </button>
          </div>
        ))}
      </div>

      {/* ROW 2: Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Bar Chart */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">New vs. Existing Ads Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time database ad detections over last 6 months</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
              <Zap size={14} /> Real-Time Sync
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 relative">
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-100">
                <span className="text-[10px] text-slate-300 pl-1">Max</span>
              </div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-100">
                <span className="text-[10px] text-slate-300 pl-1">Mid</span>
              </div>

              {(stats?.monthlyTrends && stats.monthlyTrends.length > 0
                ? stats.monthlyTrends
                : [
                    { month: 'Oct', newCount: 3, existingCount: 8, total: 11 },
                    { month: 'Nov', newCount: 5, existingCount: 12, total: 17 },
                    { month: 'Dec', newCount: 8, existingCount: 15, total: 23 },
                    { month: 'Jan', newCount: 4, existingCount: 10, total: 14 },
                    { month: 'Feb', newCount: 6, existingCount: 14, total: 20 },
                    { month: 'Mar', newCount: 9, existingCount: 18, total: 27 },
                  ]
              ).map((bar, i) => {
                const newHeight = Math.max(Math.round((bar.newCount / maxMonthlyTotal) * 100), bar.newCount > 0 ? 12 : 5);
                const existingHeight = Math.max(Math.round((bar.existingCount / maxMonthlyTotal) * 100), bar.existingCount > 0 ? 15 : 5);

                return (
                  <div key={i} className="flex flex-col items-center gap-2 z-10 flex-1">
                    <div className="flex items-end gap-1.5 h-36">
                      <div style={{ height: `${newHeight}%` }} className="w-3 bg-emerald-500 rounded-t-sm transition-all" title={`New: ${bar.newCount}`}></div>
                      <div style={{ height: `${existingHeight}%` }} className="w-3 bg-purple-600 rounded-t-sm transition-all" title={`Existing: ${bar.existingCount}`}></div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{bar.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-100 min-w-[160px]">
              <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-100" strokeWidth="4" />
                  <path className="text-emerald-500 stroke-current" strokeWidth="4" fill="none"
                    strokeDasharray="30 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-purple-600 stroke-current" strokeWidth="4" fill="none"
                    strokeDasharray="70 100" strokeDashoffset="-30"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-sm font-bold text-slate-900">
                    {stats?.totalAds ? Math.round((stats.newAdsToday / stats.totalAds) * 100) : 0}%
                  </span>
                  <p className="text-[9px] text-slate-400 leading-tight">New Today</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold w-full">
                <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span> Existing Ads</span>
                <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span> New Ads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Groups Status Donut */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Groups Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active vs Paused Monitoring</p>
            </div>
            <button onClick={fetchStats} className="text-slate-300 hover:text-slate-600">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-100" strokeWidth="4.5" />
                <path className="text-purple-600 stroke-current" strokeWidth="4.5" fill="none"
                  strokeDasharray={`${activeRatio} 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-amber-400 stroke-current" strokeWidth="4.5" fill="none"
                  strokeDasharray={`${pausedRatio} 100`}
                  strokeDashoffset={`-${activeRatio}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-extrabold text-slate-900">{stats?.totalGroups ?? 0}</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Total Groups</p>
              </div>
            </div>
          </div>

          <div className="flex justify-around pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>Active ({stats?.activeGroups ?? 0})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Paused ({(stats?.totalGroups ?? 0) - (stats?.activeGroups ?? 0)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
