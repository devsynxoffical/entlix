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
  const [telegramApiId, setTelegramApiId] = useState('');
  const [telegramApiHash, setTelegramApiHash] = useState('');
  const [telegramSession, setTelegramSession] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramSessionHint, setTelegramSessionHint] = useState('');
  const [telegramApiHashHint, setTelegramApiHashHint] = useState('');
  const [telegramHasApiHash, setTelegramHasApiHash] = useState(false);
  const [telegramHasSession, setTelegramHasSession] = useState(false);

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
          if (data.telegramApiId) setTelegramApiId(data.telegramApiId);
          if (data.telegramConnected !== undefined) setTelegramConnected(!!data.telegramConnected);
          if (data.telegramSessionHint) setTelegramSessionHint(data.telegramSessionHint);
          if (data.telegramApiHashHint) setTelegramApiHashHint(data.telegramApiHashHint);
          if (data.telegramHasApiHash !== undefined) setTelegramHasApiHash(!!data.telegramHasApiHash);
          if (data.telegramHasSession !== undefined) setTelegramHasSession(!!data.telegramHasSession);
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
        telegramApiId: telegramApiId.trim(),
      };
      if (telegramApiHash.trim()) {
        payload.telegramApiHash = telegramApiHash.trim();
      }
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
        setTelegramApiHash('');
        setTelegramSession('');
        if (data.telegramApiId) setTelegramApiId(data.telegramApiId);
        if (data.telegramConnected !== undefined) setTelegramConnected(!!data.telegramConnected);
        if (data.telegramSessionHint) setTelegramSessionHint(data.telegramSessionHint);
        if (data.telegramApiHashHint) setTelegramApiHashHint(data.telegramApiHashHint);
        if (data.telegramHasApiHash !== undefined) setTelegramHasApiHash(!!data.telegramHasApiHash);
        if (data.telegramHasSession !== undefined) setTelegramHasSession(!!data.telegramHasSession);
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
            <h2 className="text-base font-bold text-slate-900">Telegram credentials</h2>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              telegramConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            Status:{' '}
            {telegramConnected
              ? 'Ready — API ID, Hash, and Session are configured'
              : 'Incomplete — follow the steps below, then fill all three fields'}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">How to get these details (step by step)</h3>
            <ol className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#229ED9] text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-800">Open Telegram API dashboard</p>
                  <p className="mt-0.5">
                    Go to{' '}
                    <a
                      href="https://my.telegram.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#229ED9] font-semibold underline underline-offset-2"
                    >
                      https://my.telegram.org
                    </a>{' '}
                    and log in with your phone number (same number as your Telegram app). Enter the login code Telegram sends you.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#229ED9] text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-800">Create an API application</p>
                  <p className="mt-0.5">
                    Click <strong>API development tools</strong>. If you have no app yet, create one:
                  </p>
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-500">
                    <li>
                      <strong>App title</strong> — any name (e.g. Entiix Group Discovery)
                    </li>
                    <li>
                      <strong>Short name</strong> — letters/numbers only, 5–32 chars (e.g. entiixgroups)
                    </li>
                    <li>Platform / description can be left as defaults</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#229ED9] text-white text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-800">Copy App api_id and App api_hash</p>
                  <p className="mt-0.5">
                    On the <strong>App configuration</strong> page you will see:
                  </p>
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-500">
                    <li>
                      <strong>App api_id</strong> — a number (paste into the api_id field below)
                    </li>
                    <li>
                      <strong>App api_hash</strong> — a long hex string (paste into api_hash below)
                    </li>
                  </ul>
                  <p className="mt-1 text-slate-500">
                    You do <strong>not</strong> need the “Test/Production DC” addresses or RSA public keys — Entiix handles those automatically.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#229ED9] text-white text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-800">Generate StringSession (one-time login)</p>
                  <p className="mt-0.5">
                    api_id / api_hash alone are not enough. On your computer, in the Entiix project folder, run:
                  </p>
                  <pre className="mt-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-3 py-2 rounded-lg overflow-x-auto">
                    npm run telegram:login
                  </pre>
                  <p className="mt-1.5 text-slate-500">
                    Enter your phone (with country code, e.g. <code className="bg-white px-1 rounded border">+92…</code>), then the code from Telegram, then 2FA password if you use one. The script prints a long <strong>StringSession</strong> — copy the whole line.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#229ED9] text-white text-[11px] font-bold flex items-center justify-center">
                  5
                </span>
                <div>
                  <p className="font-bold text-slate-800">Paste here and save</p>
                  <p className="mt-0.5">
                    Fill <strong>api_id</strong>, <strong>api_hash</strong>, and <strong>StringSession</strong> below → click{' '}
                    <strong>Save All Preferences</strong>. Status should turn green. Then go to{' '}
                    <strong>Telegram</strong> in the sidebar, add a keyword, and click Scan.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-200 pt-3">
              Tip: keep api_hash and StringSession private (like passwords). For production you can also set{' '}
              <code className="bg-white px-1 rounded border">TELEGRAM_API_ID</code>,{' '}
              <code className="bg-white px-1 rounded border">TELEGRAM_API_HASH</code>, and{' '}
              <code className="bg-white px-1 rounded border">TELEGRAM_SESSION</code> on Railway.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                App api_id
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="From my.telegram.org → App api_id"
                value={telegramApiId}
                onChange={(e) => setTelegramApiId(e.target.value)}
                className="input-field text-sm font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                App api_hash {telegramHasApiHash && !telegramApiHash ? `(saved: ${telegramApiHashHint})` : ''}
              </label>
              <input
                type="password"
                placeholder={telegramHasApiHash ? 'Leave blank to keep current hash' : 'From my.telegram.org → App api_hash'}
                value={telegramApiHash}
                onChange={(e) => setTelegramApiHash(e.target.value)}
                className="input-field text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              StringSession {telegramHasSession && !telegramSession ? `(saved: ${telegramSessionHint})` : ''}
            </label>
            <textarea
              rows={3}
              placeholder={
                telegramHasSession
                  ? 'Leave blank to keep current session — or paste a new one'
                  : 'Paste the long string printed by: npm run telegram:login'
              }
              value={telegramSession}
              onChange={(e) => setTelegramSession(e.target.value)}
              className="input-field text-xs font-mono"
            />
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
