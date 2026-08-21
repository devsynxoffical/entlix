'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AdCard from './AdCard';
import { resolveAdCreativeUrl, resolveSourceLink } from '@/lib/adCreative';
import { 
  Search, Filter, Loader2, RefreshCw, AlertCircle, Download, 
  X, ExternalLink, Copy, Check, MessageSquare, Tag, MapPin, 
  Clock, Sparkles, Building2, ImageOff
} from 'lucide-react';

export default function ResultsDashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, NEW, EXISTING, FAVORITE
  const [copyLengthFilter, setCopyLengthFilter] = useState('ALL'); // ALL, SHORT, LONG

  // Root Modal States
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'PREVIEW' | 'AI_COUNTER'>('PREVIEW');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Competitor Brand Dossier Modal States
  const [dossierName, setDossierName] = useState<string | null>(null);
  const [dossierData, setDossierData] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalImgSrc, setModalImgSrc] = useState<string | null>(null);
  const [modalImgFailed, setModalImgFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync modal creative when selected ad changes
  useEffect(() => {
    if (selectedAd) {
      setModalImgSrc(resolveAdCreativeUrl(selectedAd.adCreativeUrl, selectedAd.matchingKeyword));
      setModalImgFailed(false);
    } else {
      setModalImgSrc(null);
      setModalImgFailed(false);
    }
  }, [selectedAd]);

  // Prevent background scroll when any modal is active
  useEffect(() => {
    if (selectedAd || dossierName) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedAd, dossierName]);

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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load ads');
        setAds(Array.isArray(data) ? data : []);
      })
      .catch(() => setAds([]))
      .finally(() => setAdsLoading(false));
  }, [selectedGroupId]);

  const reload = () => {
    if (!selectedGroupId) return;
    setAdsLoading(true);
    fetch(`/api/ads?groupId=${selectedGroupId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load ads');
        setAds(Array.isArray(data) ? data : []);
      })
      .catch(() => setAds([]))
      .finally(() => setAdsLoading(false));
  };

  const handleFavoriteToggle = async (id: string, isFav: boolean) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, isFavorite: isFav } : a));
    if (selectedAd && selectedAd.id === id) {
      setSelectedAd((prev: any) => ({ ...prev, isFavorite: isFav }));
    }
    try {
      await fetch(`/api/ads/${id}/favorite`, { method: 'POST' });
    } catch {}
  };

  const openDossier = async (name: string) => {
    setDossierName(name);
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/advertisers/${encodeURIComponent(name)}`);
      const data = await res.json();
      setDossierData(data);
    } catch {}
    finally { setLoadingDossier(false); }
  };

  const runAiAnalysis = async (ad: any) => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adText: ad.adText,
          advertiserName: ad.advertiserName,
          matchingKeyword: ad.matchingKeyword,
          region: ad.region
        })
      });
      const data = await res.json();
      if (data.analysis) setAiAnalysis(data.analysis);
    } catch {}
    finally { setLoadingAi(false); }
  };

  const copyAdLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedLiveUrl = selectedAd
    ? resolveSourceLink(selectedAd.sourceLink, selectedAd.metaAdId)
    : null;

  const filteredAds = ads.filter(ad => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      ad.advertiserName?.toLowerCase().includes(q) ||
      ad.adText?.toLowerCase().includes(q) ||
      ad.matchingKeyword?.toLowerCase().includes(q) ||
      ad.region?.toLowerCase().includes(q) ||
      ad.whatsappContact?.toLowerCase().includes(q);

    let matchesFilter = true;
    if (filterType === 'NEW') matchesFilter = ad.classification === 'NEW';
    else if (filterType === 'EXISTING') matchesFilter = ad.classification === 'EXISTING';
    else if (filterType === 'FAVORITE') matchesFilter = !!ad.isFavorite;

    let matchesCopyLength = true;
    const wordCount = (ad.adText || '').split(/\s+/).length;
    if (copyLengthFilter === 'SHORT') matchesCopyLength = wordCount <= 30;
    else if (copyLengthFilter === 'LONG') matchesCopyLength = wordCount > 30;

    return matchesSearch && matchesFilter && matchesCopyLength;
  });

  // Export filtered ad leads to CSV
  const exportToCSV = () => {
    if (filteredAds.length === 0) return;

    const headers = ['Advertiser Name', 'Classification', 'Matching Keyword', 'Region', 'WhatsApp Contact', 'Ad Text', 'Detected Date', 'Source Link'];
    const rows = filteredAds.map(ad => [
      `"${(ad.advertiserName || '').replace(/"/g, '""')}"`,
      `"${ad.classification || ''}"`,
      `"${(ad.matchingKeyword || '').replace(/"/g, '""')}"`,
      `"${(ad.region || '').replace(/"/g, '""')}"`,
      `"${ad.whatsappContact || ''}"`,
      `"${(ad.adText || '').replace(/"/g, '""')}"`,
      `"${new Date(ad.firstDetectedAt).toLocaleString()}"`,
      `"${resolveSourceLink(ad.sourceLink, ad.metaAdId) || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Entiix_Meta_Ad_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center bg-white border border-slate-200/80">
        <AlertCircle size={40} className="text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-700 mb-1">No monitoring groups configured</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-4">Go to <strong>Monitoring Groups</strong> in the sidebar to create your first target group.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Group</label>
            <select
              className="input-field py-2 text-sm max-w-full sm:max-w-xs font-semibold bg-white flex-1"
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
            <button
              onClick={exportToCSV}
              disabled={filteredAds.length === 0}
              className="btn btn-secondary text-sm py-2 px-3 gap-1.5 bg-white"
              title="Export Lead List to CSV/Excel"
            >
              <Download size={14} className="text-purple-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={reload} className="btn btn-secondary text-sm py-2 px-3 gap-1.5 bg-white" title="Refresh Feed">
              <RefreshCw size={14} className={adsLoading ? 'animate-spin text-purple-600' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ads, WhatsApp..."
              className="input-field text-sm py-2 pl-9 bg-white w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input-field text-sm py-2 pl-9 font-medium bg-white"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New Ads Only</option>
              <option value="EXISTING">Existing Baseline</option>
              <option value="FAVORITE">Bookmarked Favorites</option>
            </select>
          </div>
          <select
            className="input-field text-sm py-2 font-medium bg-white"
            value={copyLengthFilter}
            onChange={e => setCopyLengthFilter(e.target.value)}
          >
            <option value="ALL">All Copy Lengths</option>
            <option value="SHORT">Short-form (&le;30 words)</option>
            <option value="LONG">Long-form (&gt;30 words)</option>
          </select>
        </div>
      </div>

      {/* Feed Status Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-semibold">
            {adsLoading ? 'Syncing feed...' : `${filteredAds.length} ad${filteredAds.length !== 1 ? 's' : ''} found`}
          </span>
          {filterType !== 'ALL' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
              Filter: {filterType}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:block">
          Click any card to inspect full ad details & WhatsApp outreach
        </span>
      </div>

      {/* Ads Grid */}
      {adsLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.length > 0
            ? filteredAds.map(ad => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  onSelect={(item) => {
                    setSelectedAd(item);
                    setModalTab('PREVIEW');
                    setAiAnalysis(null);
                  }}
                  onOpenDossier={openDossier}
                  onFavoriteToggle={handleFavoriteToggle} 
                />
              ))
            : (
              <div className="col-span-full glass-card py-16 text-center bg-white border border-slate-200">
                <Search size={32} className="mx-auto mb-3 text-slate-300" />
                <h4 className="text-base font-bold text-slate-700 mb-1">No matching ads found</h4>
                <p className="text-slate-500 text-sm">Try tweaking your search terms or filter selection.</p>
              </div>
            )
          }
        </div>
      )}

      {/* Portaled modals — rendered on document.body so they aren't clipped by content-area overflow */}
      {mounted && selectedAd && createPortal(
        <div
          onClick={() => setSelectedAd(null)}
          className="modal-overlay animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <button
                  onClick={() => setModalTab('PREVIEW')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${modalTab === 'PREVIEW' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                >
                  Ad Creative
                </button>
                <button
                  onClick={() => {
                    setModalTab('AI_COUNTER');
                    if (!aiAnalysis) runAiAnalysis(selectedAd);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${modalTab === 'AI_COUNTER' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'}`}
                >
                  <Sparkles size={13} />
                  <span>AI Counter-Ad</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedAd(null)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4 min-h-0 flex-1">
              {modalTab === 'PREVIEW' ? (
                <div className="rounded-2xl border border-slate-200/90 shadow-sm bg-white overflow-hidden flex flex-col">
                  <div className="p-4 flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedAd.advertiserLogo ? (
                        <img
                          src={selectedAd.advertiserLogo}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {selectedAd.advertiserName ? selectedAd.advertiserName.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">{selectedAd.advertiserName}</h4>
                          <span className="badge badge-new text-[10px] py-0 px-2">Sponsored</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium break-all">ID: {selectedAd.metaAdId}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Clock size={12} /> {new Date(selectedAd.firstDetectedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {selectedAd.adText || 'No ad description available for this placement.'}
                  </div>

                  <div className="w-full aspect-[4/3] max-h-80 bg-slate-100 flex items-center justify-center overflow-hidden border-y border-slate-200/80">
                    {modalImgSrc && !modalImgFailed ? (
                      <img
                        src={modalImgSrc}
                        alt="Ad creative"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          const fallback = resolveAdCreativeUrl(null, selectedAd.matchingKeyword);
                          if (modalImgSrc !== fallback) {
                            setModalImgSrc(fallback);
                          } else {
                            setModalImgFailed(true);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
                        <ImageOff size={32} />
                        <span className="text-xs font-medium">Creative preview unavailable</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-100 gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                        {selectedAd.advertiserLink || 'FACEBOOK.COM/ADS'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedAd.matchingKeyword ? `${selectedAd.matchingKeyword.toUpperCase()} Offer` : 'Special Promo'}
                      </span>
                    </div>
                    {selectedLiveUrl && (
                      <a
                        href={selectedLiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary text-xs py-1.5 px-3.5 font-bold shrink-0"
                      >
                        <span>Open Live Ad</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {loadingAi ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-purple-600" size={28} />
                      <span className="text-xs font-semibold text-slate-600">Analyzing competitor hooks & generating counter copy...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Hook Angle</span>
                          <p className="text-xs font-black text-purple-900 mt-0.5">{aiAnalysis.hookAngle}</p>
                        </div>
                        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Offer Type</span>
                          <p className="text-xs font-black text-indigo-900 mt-0.5">{aiAnalysis.offerType}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Buyer Pain Points</h4>
                        <ul className="space-y-1.5">
                          {(aiAnalysis.targetPainPoints || []).map((pt: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Generated Counter-Ad Variations</h4>
                        <div className="flex flex-col gap-3">
                          {(aiAnalysis.counterAds || []).map((cAd: any, i: number) => (
                            <div key={i} className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">{cAd.angleName}</span>
                              <h5 className="text-xs font-bold text-amber-300">{cAd.headline}</h5>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-normal">{cAd.primaryText}</p>
                              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs gap-2">
                                <span className="text-slate-400 text-[11px]">CTA: <strong className="text-white">{cAd.callToAction}</strong></span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${cAd.headline}\n\n${cAd.primaryText}`);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                  }}
                                  className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-800 shrink-0"
                                >
                                  <Copy size={11} /> Copy Ad
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">Could not load AI analysis. Try again.</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-purple-700 flex items-center gap-1.5 min-w-0">
                  <Tag size={13} className="shrink-0" />
                  <span className="truncate">#{selectedAd.matchingKeyword}</span>
                </div>
                <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-700 flex items-center gap-1.5 justify-end min-w-0">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{selectedAd.region}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => copyAdLink(selectedLiveUrl || '')}
                disabled={!selectedLiveUrl}
                className="btn btn-secondary text-xs py-2 px-3 gap-1.5 font-bold"
              >
                {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {selectedAd.whatsappContact && (
                  <a
                    href={`https://wa.me/${selectedAd.whatsappContact.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 gap-1.5 font-bold"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedLiveUrl && (
                  <a
                    href={selectedLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs py-2 px-4 gap-1.5 font-bold"
                  >
                    <span>Meta Library</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && dossierName && createPortal(
        <div
          onClick={() => setDossierName(null)}
          className="modal-overlay animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 size={20} className="text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight truncate">{dossierName} Portfolio</h3>
                  <span className="text-[11px] text-slate-400 font-medium">Competitor Brand Dossier & Ad History</span>
                </div>
              </div>
              <button onClick={() => setDossierName(null)} className="text-slate-400 hover:text-white p-1 shrink-0" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4 min-h-0 flex-1">
              {loadingDossier ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
              ) : dossierData ? (
                <>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl">
                      <span className="text-xl font-black text-purple-700">{dossierData.totalAdsTracked}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Total Ads</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <span className="text-xl font-black text-emerald-700">{dossierData.newAdsCount}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">New Ads</p>
                    </div>
                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-2xl">
                      <span className="text-xl font-black text-cyan-700">{dossierData.whatsappCount}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">WhatsApp</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Keywords & Regions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(dossierData.keywordsUsed || []).map((kw: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">#{kw}</span>
                      ))}
                      {(dossierData.regionsTargeted || []).map((rg: string, i: number) => (
                        <span key={`r-${i}`} className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg font-bold">{rg}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ad Portfolio History</h4>
                    <div className="flex flex-col gap-2.5">
                      {(dossierData.ads || []).map((portfolioAd: any) => (
                        <div key={portfolioAd.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <p className="font-semibold text-slate-800 line-clamp-2 flex-1">{portfolioAd.adText || 'No text'}</p>
                          <span className={`badge shrink-0 ${portfolioAd.classification === 'NEW' ? 'badge-new' : 'badge-existing'}`}>{portfolioAd.classification}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">Could not load brand dossier.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
