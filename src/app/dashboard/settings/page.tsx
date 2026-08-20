"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Save, Key, Globe, Bell, User as UserIcon, Shield, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [region, setRegion] = useState("Global");
  const [notifications, setNotifications] = useState(true);
  const [metaToken, setMetaToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/user/settings')
      .then(res => res.json())
      .then(data => {
        if (data.defaultRegion) setRegion(data.defaultRegion);
        if (data.emailAlerts !== undefined) setNotifications(data.emailAlerts);
        if (data.metaAccessToken !== undefined) setMetaToken(data.metaAccessToken);
      })
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultRegion: region,
          emailAlerts: notifications,
          metaAccessToken: metaToken
        })
      });
      if (res.ok) {
        showToast('Settings saved successfully!');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative max-w-4xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold border animate-fade-in ${
          toast.type === 'success'
            ? 'bg-white text-emerald-700 border-emerald-200 shadow-emerald-100'
            : 'bg-white text-red-600 border-red-200 shadow-red-100'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Account & System Settings</h2>
          <p className="text-sm text-slate-500">Manage your monitoring preferences and Meta Ad Library credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 flex flex-col gap-8">
          {/* Profile Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <UserIcon size={18} className="text-purple-600" />
              <h3 className="text-base font-bold text-slate-800">Profile Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  disabled 
                  className="input-field bg-slate-50 text-slate-500 cursor-not-allowed" 
                  value={session?.user?.name || "Active Member"} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  disabled 
                  className="input-field bg-slate-50 text-slate-500 cursor-not-allowed" 
                  value={session?.user?.email || "user@entiix.com"} 
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Globe size={18} className="text-purple-600" />
              <h3 className="text-base font-bold text-slate-800">Monitoring Defaults</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Default Target Region</label>
                <select 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-field"
                >
                  <option value="Global">Global</option>
                  <option value="United States">United States (US)</option>
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="Canada">Canada (CA)</option>
                  <option value="Australia">Australia (AU)</option>
                  <option value="Europe">Europe (EU)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Email Ad Alerts</h4>
                    <p className="text-xs text-slate-500">Receive instant email notifications when new competitor ads are detected.</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications} 
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Meta API Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Key size={18} className="text-purple-600" />
              <h3 className="text-base font-bold text-slate-800">Meta Ad Library Integration</h3>
            </div>
            <div className="form-group">
              <label className="form-label flex justify-between">
                <span>Meta Graph API Access Token</span>
                <span className="text-xs font-normal text-slate-400">Optional for live Meta Graph queries</span>
              </label>
              <input 
                type="password" 
                placeholder="EAAB... (Leave blank to use keyword simulation engine)" 
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                className="input-field font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                If provided, Entiix queries Meta Graph API directly. When blank, the dynamic live keyword simulation engine powers your scans seamlessly.
              </p>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn btn-primary self-start px-6 py-3 shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
          </button>
        </div>

        {/* Sidebar Info Card */}
        <div className="flex flex-col gap-5">
          <div className="glass-card p-6 bg-gradient-to-br from-purple-900 to-indigo-900 text-white border-0 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <Shield size={20} className="text-purple-300" />
            </div>
            <h4 className="text-lg font-bold mb-2">Real-Time Intelligence</h4>
            <p className="text-xs text-purple-200 leading-relaxed mb-4">
              Entiix runs non-stop tracking on configured monitoring groups. Every detected ad is deduplicated and categorized automatically.
            </p>
            <div className="p-3 bg-white/10 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active & Scanning
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
