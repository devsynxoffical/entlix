import ResultsDashboard from "@/components/ResultsDashboard";
import DashboardAnalytics from "@/components/DashboardAnalytics";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* KPI Stat Cards & Visual Charts from Reference Screenshot */}
      <DashboardAnalytics />

      {/* Main Results Table Feed */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Live Advertisements Feed</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time detected Meta ad creatives across your monitoring groups.</p>
          </div>
        </div>
        
        <div className="glass-panel p-6">
          <ResultsDashboard />
        </div>
      </div>
    </div>
  );
}
