'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Bell, Globe, CheckCircle2, MessageSquare, Hash, Mail, Send } from 'lucide-react';
import { REGION_OPTIONS } from '@/lib/regions';

export default function SettingsPage() {
  const [accountEmail, setAccountEmail] = useState('');
  const [defaultRegion, setDefaultRegion] = useState('Global');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [telegramSession, setTelegramSession] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramSessionHint, setTelegramSessionHint] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.email) setAccountEmail(data.email);
          if (data.defaultRegion) setDefaultRegion(data.defaultRegion);
          if (data.emailAlerts !== undefined) setEmailAlerts(data.emailAlerts);
          if (data.metaAccessToken) setMetaAccessToken(data.metaAccessToken);
          if (data.slackWebhookUrl) setSlackWebhookUrl(data.slackWebhookUrl);
          if (data.discordWebhookUrl) setDiscordWebhookUrl(data.discordWebhookUrl);
          if (data.telegramConnected !== undefined) setTelegramConnected(!!data.telegramConnected);
          if (data.telegramSessionHint) setTelegramSessionHint(data.telegramSessionHint);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        defaultRegion,
        emailAlerts,
        metaAccessToken,
        slackWebhookUrl,
        discordWebhookUrl,
      };
      // Only send session when user typed a new value (avoid wiping with empty on every save)
      if (telegramSession.trim()) {
        payload.telegramSession = telegramSession.trim();
      }

      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setTelegramSession('');
        if (data.telegramConnected !== undefined) setTelegramConnected(!!data.telegramConnected);
        if (data.telegramSessionHint) setTelegramSessionHint(data.telegramSessionHint);
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
          Manage Meta credentials, hourly lead emails, and alert destinations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>All system preferences and integration keys updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="glass-card p-6 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="text-purple-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Hourly New Lead Emails</h2>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Alerts are sent to</p>
            <p className="text-sm font-bold text-slate-900 break-all">
              {accountEmail || 'your login email'}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This is your Entiix account email (the one you signed in with). Every hour Entiix scans active monitoring groups; when a new ad is found, an email is sent here automatically.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span>
              <span className="block text-sm font-bold text-slate-900">Enable email alerts for new ads</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Turn off to stop hourly lead emails (scans still run; you just will not get mail).
              </span>
            </span>
          </label>
        </div>

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
              Required to fetch live ads from Meta Ad Library Graph API. Generate a token with ads_read permission.
            </p>
          </div>
        </div>

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

        <div className="glass-card p-6 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="text-[#229ED9]" size={20} />
            <h2 className="text-base font-bold text-slate-900">Telegram MTProto Session</h2>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 leading-relaxed">
            Status:{' '}
            <strong className={telegramConnected ? 'text-emerald-700' : 'text-amber-700'}>
              {telegramConnected ? 'Connected' : 'Not connected'}
            </strong>
            {telegramSessionHint ? (
              <span className="text-slate-400 font-mono ml-2">{telegramSessionHint}</span>
            ) : null}
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>
                Create an app at{' '}
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#229ED9] font-semibold"
                >
                  my.telegram.org
                </a>{' '}
                → set <code className="bg-white px-1 rounded">TELEGRAM_API_ID</code> /{' '}
                <code className="bg-white px-1 rounded">TELEGRAM_API_HASH</code> on the server
              </li>
              <li>
                Run locally: <code className="bg-white px-1 rounded">node scripts/telegram-login.mjs</code>
              </li>
              <li>Paste the StringSession below (or set Railway <code className="bg-white px-1 rounded">TELEGRAM_SESSION</code>)</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Paste new StringSession (leave blank to keep current)
            </label>
            <textarea
              rows={3}
              placeholder="1BVtsOHwBu..."
              value={telegramSession}
              onChange={(e) => setTelegramSession(e.target.value)}
              className="input-field text-xs font-mono"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Treat this like a password. Only public groups/channels can be discovered by keyword search.
            </p>
          </div>
        </div>

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
              {REGION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

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
