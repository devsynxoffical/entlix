import ResultsDashboard from "@/components/ResultsDashboard";
import DashboardAnalytics from "@/components/DashboardAnalytics";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      <DashboardAnalytics />

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Live Advertisements Feed</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time Meta ad creatives · ads kept for 7 days then refreshed
          </p>
        </div>

        <div className="glass-panel overflow-hidden">
          <ResultsDashboard />
        </div>
      </div>
    </div>
  );
}
