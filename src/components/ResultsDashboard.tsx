'use client';

import { useState, useEffect } from 'react';
import AdCard from './AdCard';
import { Search, Filter, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function ResultsDashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setGroups(list);
        if (list.length > 0) setSelectedGroupId(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    setAdsLoading(true);
    fetch(`/api/ads?groupId=${selectedGroupId}`)
      .then(res => res.json())
      .then(data => { setAds(Array.isArray(data) ? data : []); })
      .finally(() => setAdsLoading(false));
  }, [selectedGroupId]);

  const reload = () => {
    if (!selectedGroupId) return;
    setAdsLoading(true);
    fetch(`/api/ads?groupId=${selectedGroupId}`)
      .then(res => res.json())
      .then(data => setAds(Array.isArray(data) ? data : []))
      .finally(() => setAdsLoading(false));
  };

  const filteredAds = ads.filter(ad => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      ad.advertiserName?.toLowerCase().includes(q) ||
      ad.adText?.toLowerCase().includes(q) ||
      ad.matchingKeyword?.toLowerCase().includes(q) ||
      ad.region?.toLowerCase().includes(q);
    const matchesFilter = filterType === 'ALL' || ad.classification === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center">
        <AlertCircle size={40} className="text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-700 mb-1">No monitoring groups configured</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-4">Go to <strong>Monitoring Groups</strong> in the sidebar to create your first target group.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Selected Group:</label>
          <select
            className="input-field py-2 text-sm max-w-xs font-semibold"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g._count?.advertisements ?? 0} ads)
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" 
              placeholder="Search ads, advertisers, keywords..."
              className="input-field text-sm py-2 pl-9"
              style={{ minWidth: '220px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input-field text-sm py-2 pl-9"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New Ads Only</option>
              <option value="EXISTING">Existing Baseline</option>
            </select>
          </div>
          <button onClick={reload} className="btn btn-secondary text-sm py-2 px-3 gap-1.5" title="Refresh Ads Feed">
            <RefreshCw size={14} className={adsLoading ? 'animate-spin text-purple-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Feed Status Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-semibold">
            {adsLoading ? 'Syncing feed...' : `${filteredAds.length} ad${filteredAds.length !== 1 ? 's' : ''} tracked`}
          </span>
          {filterType !== 'ALL' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
              Filter: {filterType}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:block">
          Click any card to inspect full creative details
        </span>
      </div>

      {adsLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.length > 0
            ? filteredAds.map(ad => <AdCard key={ad.id} ad={ad} />)
            : (
              <div className="col-span-full glass-card py-16 text-center">
                <Search size={32} className="mx-auto mb-3 text-slate-300" />
                <h4 className="text-base font-bold text-slate-700 mb-1">No matching ads found</h4>
                <p className="text-slate-500 text-sm">Try tweaking your search terms or filter selection.</p>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
