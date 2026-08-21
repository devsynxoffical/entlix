'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Bell, Globe, CheckCircle2, MessageSquare, Hash } from 'lucide-react';

export default function SettingsPage() {
  const [defaultRegion, setDefaultRegion] = useState('Global');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.defaultRegion) setDefaultRegion(data.defaultRegion);
          if (data.emailAlerts !== undefined) setEmailAlerts(data.emailAlerts);
          if (data.metaAccessToken) setMetaAccessToken(data.metaAccessToken);
          if (data.slackWebhookUrl) setSlackWebhookUrl(data.slackWebhookUrl);
          if (data.discordWebhookUrl) setDiscordWebhookUrl(data.discordWebhookUrl);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultRegion,
          emailAlerts,
          metaAccessToken,
          slackWebhookUrl,
          discordWebhookUrl
        })
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-hero">System & Integration Settings</h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage your Meta Graph API credentials, alert destinations, and default search regions.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>All system preferences and integration keys updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Meta Graph API Credentials */}
        <div className="glass-card p-6 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key className="text-purple-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Meta Graph API Access Token</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              User Access Token (Required for Live Meta Ad Library Queries)
            </label>
            <input 
              type="password" 
              placeholder="EAAU9woPMKn4BS..." 
              value={metaAccessToken}
              onChange={e => setMetaAccessToken(e.target.value)}
              className="input-field text-sm font-mono"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Required to fetch live ads directly from Meta Ad Library Graph API (`ads_archive`). Generate your token in Meta Developer Portal with `ads_read` permission.
            </p>
          </div>
        </div>

        {/* Live Notification Webhooks */}
        <div className="glass-card p-6 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="text-purple-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Slack & Discord Live Alert Webhooks</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Hash size={14} className="text-emerald-600" />
                Slack Incoming Webhook URL
              </label>
              <input 
                type="url" 
                placeholder="https://hooks.slack.com/services/..." 
                value={slackWebhookUrl}
                onChange={e => setSlackWebhookUrl(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-600" />
                Discord Webhook URL
              </label>
              <input 
                type="url" 
                placeholder="https://discord.com/api/webhooks/..." 
                value={discordWebhookUrl}
                onChange={e => setDiscordWebhookUrl(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Default Regional Search Preferences */}
        <div className="glass-card p-6 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="text-purple-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Default Target Region</h2>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Default Region for New Monitoring Groups
            </label>
            <select 
              value={defaultRegion}
              onChange={e => setDefaultRegion(e.target.value)}
              className="input-field text-sm font-semibold max-w-xs"
            >
              <option value="United Kingdom">United Kingdom (UK)</option>
              <option value="United States">United States (US)</option>
              <option value="Global">Global / Worldwide</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Europe">Europe (EU)</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-primary py-3 px-6 text-sm font-bold gap-2 shadow-lg shadow-purple-500/20"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
