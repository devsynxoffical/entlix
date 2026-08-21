'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pause, Play, RefreshCw, Edit3, Globe, Tag, CheckCircle2, AlertCircle, Loader2, Zap, X } from 'lucide-react';

type Group = {
  id: string;
  name: string;
  keywords: string;
  region: string;
  status: string;
  createdAt: string;
  _count: { advertisements: number };
};

export default function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [region, setRegion] = useState('United Kingdom');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, keywords, region }),
      });
      if (res.ok) {
        showToast('Group created! Baseline scanner initialized.');
        setName(''); setKeywords(''); setShowForm(false);
        fetchGroups();
      } else {
        showToast('Failed to create group', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setKeywords(group.keywords);
    setRegion(group.region);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, keywords, region }),
      });
      if (res.ok) {
        showToast('Monitoring group updated!');
        setEditingGroup(null);
        setName(''); setKeywords('');
        fetchGroups();
      } else {
        showToast('Failed to update group', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (group: Group) => {
    const newStatus = group.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Group ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'}`);
        setGroups(g => g.map(x => x.id === group.id ? { ...x, status: newStatus } : x));
      }
    } catch { showToast('Failed to update group', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group and all tracked ads? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Group deleted');
        setGroups(g => g.filter(x => x.id !== id));
      }
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleScan = async (id: string) => {
    setScanningId(id);
    try {
      const res = await fetch(`/api/groups/${id}/scan`, { method: 'POST' });
      const data = await res.json();
      showToast(data.detected ? `🎉 New ad detected and saved!` : 'Scan complete — no new ads found.');
      if (data.detected) fetchGroups();
    } catch { showToast('Scan failed', 'error'); }
    finally { setScanningId(null); }
  };

  const handleScanAll = async () => {
    setIsScanningAll(true);
    try {
      const res = await fetch('/api/groups/scan-all', { method: 'POST' });
      const data = await res.json();
      showToast(`Scan complete for ${data.scanned} active groups. ${data.newAdsDetected} new ad(s) detected!`);
      fetchGroups();
    } catch {
      showToast('Batch scan failed', 'error');
    } finally {
      setIsScanningAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
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

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Monitoring Groups</h2>
          <p className="text-sm text-slate-500">{groups.length} group{groups.length !== 1 ? 's' : ''} configured & active</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleScanAll}
            disabled={isScanningAll || groups.length === 0}
            className="btn btn-secondary text-sm flex items-center gap-2"
          >
            <Zap size={16} className={isScanningAll ? 'animate-bounce text-amber-500' : 'text-purple-600'} />
            <span>{isScanningAll ? 'Scanning All...' : 'Scan All Groups'}</span>
          </button>
          <button
            onClick={() => {
              setShowForm(v => !v);
              setEditingGroup(null);
              setName(''); setKeywords('');
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Plus size={18} /> Create New Group
          </button>
        </div>
      </div>

      {/* Create / Edit Form Card */}
      {(showForm || editingGroup) && (
        <div className="glass-panel p-6 border border-purple-100 shadow-lg shadow-purple-500/5 animate-fade-in relative">
          <button
            onClick={() => { setShowForm(false); setEditingGroup(null); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>

          <h3 className="text-base font-bold text-slate-800 mb-4">
            {editingGroup ? `Edit Group: ${editingGroup.name}` : 'New Monitoring Group'}
          </h3>

          <form onSubmit={editingGroup ? handleUpdate : handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="form-label">Group Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="input-field" placeholder="e.g. SaaS Analytics UK"
              />
            </div>
            <div className="form-group sm:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Keywords <span className="text-slate-400 font-normal">(semicolon-separated)</span></label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!name) {
                      alert('Please enter a Group Name or Niche first to suggest keywords.');
                      return;
                    }
                    try {
                      const res = await fetch(`/api/ai/keywords?niche=${encodeURIComponent(name)}`);
                      const data = await res.json();
                      if (data.formattedString) {
                        setKeywords(data.formattedString);
                      }
                    } catch {}
                  }}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Zap size={12} className="text-purple-600" />
                  <span>✨ Auto-Suggest AI Keywords</span>
                </button>
              </div>
              <input
                type="text" required value={keywords} onChange={e => setKeywords(e.target.value)}
                className="input-field" placeholder="e.g. lead generation; marketing automation; CRM"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="input-field">
                <option value="United Kingdom">United Kingdom (UK)</option>
                <option value="United States">United States (US)</option>
                <option value="Global">Global</option>
                <option value="Canada">Canada (CA)</option>
                <option value="Australia">Australia (AU)</option>
                <option value="Europe">Europe (EU)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button" onClick={() => { setShowForm(false); setEditingGroup(null); }}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary text-sm shadow-md">
                {isSubmitting ? 'Saving...' : editingGroup ? 'Update Group' : 'Create & Run Baseline'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map(group => {
          const kwList = group.keywords.split(';').map(k => k.trim()).filter(Boolean);
          const isScanningThis = scanningId === group.id;

          return (
            <div key={group.id} className="glass-card p-5 flex flex-col justify-between border border-slate-200/80 hover:border-purple-200">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-500 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-slate-300'}`}></div>
                    <h3 className="text-base font-bold text-slate-800">{group.name}</h3>
                  </div>
                  <span className={`badge ${group.status === 'ACTIVE' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                    {group.status}
                  </span>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {kwList.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-md">
                      <Tag size={10} className="text-purple-500" /> #{kw}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-cyan-500" />
                    <span>{group.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end font-semibold text-slate-700">
                    <span>{group._count?.advertisements ?? 0} ads detected</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                <button
                  onClick={() => handleScan(group.id)}
                  disabled={isScanningThis}
                  className="btn btn-secondary text-xs py-1.5 px-3 gap-1.5"
                >
                  <RefreshCw size={13} className={isScanningThis ? 'animate-spin text-purple-600' : ''} />
                  <span>{isScanningThis ? 'Scanning...' : 'Scan Now'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(group)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit Group"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleToggle(group)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title={group.status === 'ACTIVE' ? 'Pause Monitoring' : 'Resume Monitoring'}
                  >
                    {group.status === 'ACTIVE' ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center flex flex-col items-center">
            <Tag size={40} className="text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Monitoring Groups Configured</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-sm">Create your first monitoring group to start tracking Meta competitor ads automatically.</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm shadow-md">
              <Plus size={16} /> Create First Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
