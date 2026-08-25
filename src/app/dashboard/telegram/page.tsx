import TelegramDashboard from '@/components/TelegramDashboard';

export default function TelegramPage() {
  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Telegram Groups</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Keyword search for public Telegram groups &amp; channels · first-seen alerts by email
        </p>
      </div>
      <TelegramDashboard />
    </div>
  );
}
