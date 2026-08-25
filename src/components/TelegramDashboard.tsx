'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  Star,
  Users,
  Hash,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  DATE_FILTER_OPTIONS,
  SORT_ORDER_OPTIONS,
  type DateFilter,
  type SortOrder,
  dateFilterLabel,
  formatDetectedLabel,
  matchesDateFilter,
  sortAdsByDetected,
} from '@/lib/adDateFilters';

type Keyword = {
  id: string;
  keyword: string;
  status: string;
  _count?: { groups: number };
};

type TgGroup = {
  id: string;
  telegramId: string;
  title: string;
  username: string | null;
  inviteLink: string | null;
  about: string | null;
  participantsCount: number | null;
  isChannel: boolean;
  matchingKeyword: string;
  classification: string;
  firstDetectedAt: string;
  isFavorite: boolean;
};

export default function TelegramDashboard() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState('');
  const [groups, setGroups] = useState<TgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('LAST_7_DAYS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
  const [filterType, setFilterType] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/keywords');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setKeywords(list);
      if (list.length > 0 && !selectedKeywordId) {
        setSelectedKeywordId(list[0].id);
      }
    } catch {
      showToast('Failed to load keywords');
    } finally {
      setLoading(false);
    }
  }, [selectedKeywordId]);

  const fetchGroups = useCallback(async (keywordId: string) => {
    if (!keywordId) {
      setGroups([]);
      return;
    }
    setGroupsLoading(true);
    try {
      const res = await fetch(`/api/telegram/groups?keywordId=${keywordId}`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  useEffect(() => {
    if (selectedKeywordId) fetchGroups(selectedKeywordId);
  }, [selectedKeywordId, fetchGroups]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/telegram/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setNewKeyword('');
        showToast('Keyword added');
        await fetchKeywords();
        setSelectedKeywordId(created.id);
      } else {
        showToast('Failed to add keyword');
      }
    } catch {
      showToast('Network error');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (kw: Keyword) => {
    const status = kw.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/telegram/keywords/${kw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setKeywords((prev) => prev.map((k) => (k.id === kw.id ? { ...k, status } : k)));
        showToast(status === 'ACTIVE' ? 'Keyword resumed' : 'Keyword paused');
      }
    } catch {
      showToast('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this keyword and its discovered groups?')) return;
    try {
      const res = await fetch(`/api/telegram/keywords/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Keyword deleted');
        if (selectedKeywordId === id) setSelectedKeywordId('');
        fetchKeywords();
      }
    } catch {
      showToast('Delete failed');
    }
  };

  const handleScan = async (id: string) => {
    setScanningId(id);
    try {
      const res = await fetch(`/api/telegram/keywords/${id}/scan`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.newGroupsDetected > 0
            ? `Found ${data.newGroupsDetected} new group(s)${data.emailSent ? ' · email sent' : ''}`
            : 'Scan complete — no new groups'
        );
        fetchGroups(id);
        fetchKeywords();
      } else {
        showToast(data.error || 'Scan failed — check Telegram session in Settings');
      }
    } catch {
      showToast('Scan failed');
    } finally {
      setScanningId(null);
    }
  };

  const handleFavorite = async (id: string, isFav: boolean) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, isFavorite: isFav } : g)));
    try {
      await fetch(`/api/telegram/groups/${id}/favorite`, { method: 'POST' });
    } catch {
      // revert on failure
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, isFavorite: !isFav } : g)));
    }
  };

  const filteredGroups = sortAdsByDetected(
    groups.filter((g) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        g.title?.toLowerCase().includes(q) ||
        g.username?.toLowerCase().includes(q) ||
        g.about?.toLowerCase().includes(q) ||
        g.matchingKeyword?.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterType === 'NEW') matchesFilter = g.classification === 'NEW';
      else if (filterType === 'EXISTING') matchesFilter = g.classification === 'EXISTING';
      else if (filterType === 'FAVORITE') matchesFilter = !!g.isFavorite;

      return matchesSearch && matchesFilter && matchesDateFilter(g.firstDetectedAt, dateFilter);
    }),
    sortOrder
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-[#229ED9]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 relative">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <form onSubmit={handleAdd} className="flex flex-1 gap-2 min-w-0">
              <div className="relative flex-1">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add keyword (e.g. crypto signals, forex group)"
                  className="toolbar-input pl-9"
                />
              </div>
              <button
                type="submit"
                disabled={adding || !newKeyword.trim()}
                className="btn btn-primary h-10 px-4 text-sm gap-1.5 shrink-0"
                style={{ backgroundColor: '#229ED9' }}
              >
                <Plus size={16} />
                Add
              </button>
            </form>
          </div>
          <p className="text-xs text-slate-500">
            Searches <strong>public</strong> Telegram groups/channels via your user session. New = first time Entiix sees
            that group. Configure session in Settings · ads/groups kept 7 days.
          </p>
        </div>

        {keywords.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No Telegram keywords yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Add a keyword above, connect your Telegram session in Settings, then hit Scan.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {keywords.map((kw) => (
                <div
                  key={kw.id}
                  onClick={() => setSelectedKeywordId(kw.id)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    selectedKeywordId === kw.id
                      ? 'border-[#229ED9] bg-[#229ED9]/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">#{kw.keyword}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {kw._count?.groups ?? 0} groups · {kw.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleScan(kw.id)}
                        disabled={scanningId === kw.id || kw.status !== 'ACTIVE'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#229ED9] hover:bg-sky-50"
                        title="Scan now"
                      >
                        <RefreshCw size={14} className={scanningId === kw.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => handleToggle(kw)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        title={kw.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                      >
                        {kw.status === 'ACTIVE' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(kw.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search discovered groups..."
                  className="toolbar-input pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <select
                  className="toolbar-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="NEW">New Only</option>
                  <option value="EXISTING">Existing</option>
                  <option value="FAVORITE">Favorites</option>
                </select>
                <select
                  className="toolbar-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className="toolbar-select col-span-2 lg:col-span-1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                >
                  {SORT_ORDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
              {groupsLoading
                ? 'Loading…'
                : `${filteredGroups.length} group${filteredGroups.length !== 1 ? 's' : ''}`}
              {dateFilter !== 'ALL' && (
                <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">
                  {dateFilterLabel(dateFilter)}
                </span>
              )}
            </div>

            {groupsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#229ED9]" size={28} />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-200 rounded-2xl">
                <Users size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No groups yet</p>
                <p className="text-xs text-slate-400 mt-1">Select a keyword and run Scan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGroups.map((g) => {
                  const link = g.inviteLink || (g.username ? `https://t.me/${g.username}` : null);
                  return (
                    <div
                      key={g.id}
                      className="glass-card p-4 border border-slate-200/80 flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{g.title}</h3>
                            <span
                              className={`badge ${g.classification === 'NEW' ? 'badge-new' : 'badge-existing'}`}
                            >
                              {g.classification}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {g.isChannel ? 'Channel' : 'Group'}
                            </span>
                          </div>
                          {g.username && (
                            <p className="text-xs text-[#229ED9] font-semibold mt-0.5">@{g.username}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleFavorite(g.id, !g.isFavorite)}
                          className={`p-1.5 rounded-lg ${g.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                        >
                          <Star size={15} className={g.isFavorite ? 'fill-amber-400' : ''} />
                        </button>
                      </div>

                      {g.about && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{g.about}</p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 truncate">
                          <Hash size={11} className="text-[#229ED9]" />
                          {g.matchingKeyword}
                        </span>
                        <span className="shrink-0">
                          {g.participantsCount != null ? `${g.participantsCount.toLocaleString()} members` : '—'}
                          {' · '}
                          {formatDetectedLabel(g.firstDetectedAt)}
                        </span>
                      </div>

                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn text-xs py-2 px-3 font-bold gap-1.5 text-white rounded-xl"
                          style={{ backgroundColor: '#229ED9' }}
                        >
                          Open in Telegram <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
