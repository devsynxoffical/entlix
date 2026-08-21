'use client';

import { useState } from 'react';
import { ExternalLink, Clock, Tag, MapPin, Copy, Check, Eye, X, MessageSquare, Star, Sparkles, Building2, Globe, Loader2 } from 'lucide-react';

export default function AdCard({ ad, onFavoriteToggle }: { ad: any; onFavoriteToggle?: (id: string, isFav: boolean) => void }) {
  const isNew = ad.classification === 'NEW';
  const [showModal, setShowModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(!!ad.isFavorite);

  // AI Hook Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'AI_COUNTER'>('DETAILS');

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ad.sourceLink) {
      navigator.clipboard.writeText(ad.sourceLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavState = !isFav;
    setIsFav(newFavState);
    try {
      await fetch(`/api/ads/${ad.id}/favorite`, { method: 'POST' });
      if (onFavoriteToggle) onFavoriteToggle(ad.id, newFavState);
    } catch {
      setIsFav(!newFavState);
    }
  };

  const openDossier = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDossierModal(true);
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/advertisers/${encodeURIComponent(ad.advertiserName)}`);
      const data = await res.json();
      setDossierData(data);
    } catch {}
    finally { setLoadingDossier(false); }
  };

  const runAiAnalysis = async () => {
    if (aiAnalysis) return;
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

  const whatsappCleanNumber = ad.whatsappContact ? ad.whatsappContact.replace(/[^0-9]/g, '') : null;
  const whatsappUrl = whatsappCleanNumber ? `https://wa.me/${whatsappCleanNumber}` : null;
  const isMetaSnapshot = ad.sourceLink && ad.sourceLink.includes('facebook.com/ads/archive');

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="glass-card overflow-hidden flex flex-col justify-between border border-slate-200/70 hover:border-purple-300 transition-all shadow-sm hover:shadow-md cursor-pointer group relative"
      >
        <div>
          {/* Header bar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div 
              onClick={openDossier}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
              title="Click to view Competitor Brand Portfolio"
            >
              {ad.advertiserLogo ? (
                <img src={ad.advertiserLogo} alt="Logo" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {ad.advertiserName ? ad.advertiserName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <span className="text-xs text-slate-800 font-bold truncate max-w-[130px] group-hover:text-purple-600 transition-colors flex items-center gap-1">
                {ad.advertiserName}
              </span>
              <span className={`badge shrink-0 ${isNew ? 'badge-new' : 'badge-existing'}`}>
                {ad.classification}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={toggleFavorite}
                className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                title={isFav ? 'Bookmarked in Favorites' : 'Add to Favorites'}
              >
                <Star size={15} className={isFav ? 'fill-amber-400' : ''} />
              </button>
              {ad.sourceLink && (
                <a 
                  href={ad.sourceLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-1.5"
                  title="View Original Meta Render"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
          
          {/* Content area */}
          <div className="p-5">
            {isMetaSnapshot ? (
              <div className="w-full h-52 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200/80 relative shadow-inner">
                <iframe 
                  src={ad.sourceLink} 
                  className="w-full h-full border-0 pointer-events-none scale-105"
                  title="Original Meta Ad Creative Render"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                    <Eye size={14} /> View Original Interactive Ad
                  </span>
                </div>
              </div>
            ) : ad.adCreativeUrl ? (
              <div className="w-full h-44 bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-200/50 relative">
                <img src={ad.adCreativeUrl} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                    <Eye size={14} /> Full Details & AI Counter-Ad
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-slate-50 rounded-xl mb-4 flex flex-col items-center justify-center border border-dashed border-slate-200">
                <span className="text-slate-400 text-xs font-medium">No Creative Preview</span>
              </div>
            )}
            
            <p className="text-xs leading-relaxed text-slate-600 line-clamp-3 mb-3 font-normal">
              {ad.adText || "No ad description available for this placement."}
            </p>

            {/* CTA Link Caption Badge */}
            {ad.advertiserLink && (
              <div className="mb-3 flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                <Globe size={12} className="text-purple-600 shrink-0" />
                <span className="truncate max-w-[200px]">{ad.advertiserLink}</span>
              </div>
            )}

            {/* WhatsApp Quick Lead Button */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full mb-2 btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                <MessageSquare size={14} />
                <span>Chat on WhatsApp ({ad.whatsappContact})</span>
              </a>
            )}
          </div>
        </div>
        
        {/* Footer Metadata */}
        <div className="px-5 pb-4 pt-3 bg-slate-50/30 border-t border-slate-100 grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <Tag size={13} className="text-purple-500 shrink-0" />
            <span className="truncate">#{ad.matchingKeyword}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate justify-end">
            <MapPin size={13} className="text-cyan-500 shrink-0" />
            <span className="truncate">{ad.region}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 text-slate-400 pt-1">
            <Clock size={13} className="shrink-0" />
            <span>Detected: {new Date(ad.firstDetectedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Ad Details & AI Counter-Ad Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header & Tabs */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {ad.advertiserLogo ? (
                    <img src={ad.advertiserLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      {ad.advertiserName ? ad.advertiserName.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{ad.advertiserName}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">Meta Ad ID: {ad.metaAdId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${isNew ? 'badge-new' : 'badge-existing'}`}>
                    {ad.classification}
                  </span>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 border-t border-slate-200/60 pt-3">
                <button
                  onClick={() => setActiveTab('DETAILS')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'DETAILS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                >
                  Original Meta Ad Render & Copy
                </button>
                <button
                  onClick={() => {
                    setActiveTab('AI_COUNTER');
                    runAiAnalysis();
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'AI_COUNTER' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'}`}
                >
                  <Sparkles size={14} />
                  <span>🧠 AI Breakdown & Counter-Ad</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {activeTab === 'DETAILS' ? (
                <>
                  {isMetaSnapshot ? (
                    <div className="w-full h-96 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                      <iframe 
                        src={ad.sourceLink} 
                        className="w-full h-full border-0"
                        title="Original Meta Ad Creative Preview"
                      />
                    </div>
                  ) : ad.adCreativeUrl ? (
                    <div className="w-full max-h-80 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                      <img src={ad.adCreativeUrl} alt="Ad Creative Preview" className="max-w-full max-h-80 object-contain" />
                    </div>
                  ) : null}

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ad Copy & Headline Description</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                      {ad.adText || "No description provided."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-700 flex flex-col gap-1">
                      <span className="text-[10px] text-purple-400 uppercase">Trigger Keyword</span>
                      <span className="font-bold flex items-center gap-1"><Tag size={12} /> #{ad.matchingKeyword}</span>
                    </div>
                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-700 flex flex-col gap-1">
                      <span className="text-[10px] text-cyan-400 uppercase">Target Region</span>
                      <span className="font-bold flex items-center gap-1"><MapPin size={12} /> {ad.region}</span>
                    </div>
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex flex-col gap-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase">First Detected</span>
                      <span className="font-bold flex items-center gap-1"><Clock size={12} /> {new Date(ad.firstDetectedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-5">
                  {loadingAi ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-purple-600" size={32} />
                      <span className="text-sm font-semibold text-slate-600">Analyzing competitor copy structure & hooks...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Hook Angle Detected</span>
                          <p className="text-sm font-black text-purple-900 mt-1">{aiAnalysis.hookAngle}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Offer Type</span>
                          <p className="text-sm font-black text-indigo-900 mt-1">{aiAnalysis.offerType}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Buyer Pain Points</h4>
                        <ul className="space-y-1.5">
                          {aiAnalysis.targetPainPoints.map((pt: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🔥 AI Generated Counter-Ad Variations</h4>
                        <div className="flex flex-col gap-4">
                          {aiAnalysis.counterAds.map((cAd: any, i: number) => (
                            <div key={i} className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col gap-2">
                              <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">{cAd.angleName}</span>
                              <h5 className="text-sm font-bold text-amber-300">{cAd.headline}</h5>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{cAd.primaryText}</p>
                              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">CTA Button: <strong className="text-white">{cAd.callToAction}</strong></span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${cAd.headline}\n\n${cAd.primaryText}`);
                                    alert('Counter-ad copy copied to clipboard!');
                                  }}
                                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                                >
                                  <Copy size={12} /> Copy Ad
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                onClick={copyLink}
                disabled={!ad.sourceLink}
                className="btn btn-secondary text-xs py-2 px-3 gap-1.5 w-full sm:w-auto"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Link Copied!' : 'Copy Meta Ad Link'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 gap-1.5 font-bold shadow-md shadow-emerald-500/20"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp Lead</span>
                  </a>
                )}
                {ad.sourceLink && (
                  <a
                    href={ad.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs py-2 px-4 gap-1.5 shadow-md shadow-purple-500/20 font-bold"
                  >
                    <span>Open Original Meta Ad</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Brand Dossier Portfolio Modal */}
      {showDossierModal && (
        <div 
          onClick={() => setShowDossierModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 size={22} className="text-purple-400" />
                <div>
                  <h3 className="text-base font-bold leading-tight">{ad.advertiserName} Portfolio</h3>
                  <span className="text-xs text-slate-400 font-medium">Competitor Brand Dossier & Ad History</span>
                </div>
              </div>
              <button onClick={() => setShowDossierModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {loadingDossier ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
              ) : dossierData ? (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                      <span className="text-xl font-black text-purple-700">{dossierData.totalAdsTracked}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Total Ads</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-xl font-black text-emerald-700">{dossierData.newAdsCount}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">New Ads</p>
                    </div>
                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl">
                      <span className="text-xl font-black text-cyan-700">{dossierData.whatsappCount}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">WhatsApp Leads</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Keywords & Regions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {dossierData.keywordsUsed.map((kw: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">#{kw}</span>
                      ))}
                      {dossierData.regionsTargeted.map((rg: string, i: number) => (
                        <span key={i} className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg font-bold">📍 {rg}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ad Portfolio History</h4>
                    <div className="flex flex-col gap-3">
                      {dossierData.ads.map((portfolioAd: any) => (
                        <div key={portfolioAd.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <p className="font-semibold text-slate-800 line-clamp-1 flex-1">{portfolioAd.adText || 'No text'}</p>
                          <span className={`badge ${portfolioAd.classification === 'NEW' ? 'badge-new' : 'badge-existing'}`}>{portfolioAd.classification}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
