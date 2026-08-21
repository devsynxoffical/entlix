'use client';

import { useState } from 'react';
import { ExternalLink, Clock, Tag, MapPin, Copy, Check, Eye, X, MessageSquare, Star } from 'lucide-react';

export default function AdCard({ ad, onFavoriteToggle }: { ad: any; onFavoriteToggle?: (id: string, isFav: boolean) => void }) {
  const isNew = ad.classification === 'NEW';
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(!!ad.isFavorite);

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

  const whatsappCleanNumber = ad.whatsappContact ? ad.whatsappContact.replace(/[^0-9]/g, '') : null;
  const whatsappUrl = whatsappCleanNumber ? `https://wa.me/${whatsappCleanNumber}` : null;

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="glass-card overflow-hidden flex flex-col justify-between border border-slate-200/70 hover:border-purple-300 transition-all shadow-sm hover:shadow-md cursor-pointer group relative"
      >
        <div>
          {/* Header bar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {ad.advertiserLogo ? (
                <img src={ad.advertiserLogo} alt="Logo" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {ad.advertiserName ? ad.advertiserName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <span className="text-xs text-slate-800 font-bold truncate max-w-[130px] group-hover:text-purple-600 transition-colors">
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
                  title="View Ad in Meta Library"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
          
          {/* Content area */}
          <div className="p-5">
            {ad.adCreativeUrl ? (
              <div className="w-full h-44 bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-200/50 relative">
                <img src={ad.adCreativeUrl} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                    <Eye size={14} /> Full Details
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-slate-50 rounded-xl mb-4 flex flex-col items-center justify-center border border-dashed border-slate-200">
                <span className="text-slate-400 text-xs font-medium">No Creative Preview</span>
              </div>
            )}
            
            <p className="text-xs leading-relaxed text-slate-600 line-clamp-3 mb-4 font-normal">
              {ad.adText || "No ad description available for this placement."}
            </p>

            {/* WhatsApp Quick Lead Button */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full mb-3 btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
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

      {/* Ad Details Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {ad.adCreativeUrl && (
                <div className="w-full max-h-80 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  <img src={ad.adCreativeUrl} alt="Ad Creative Preview" className="max-w-full max-h-80 object-contain" />
                </div>
              )}

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
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyLink}
                  disabled={!ad.sourceLink}
                  className="btn btn-secondary text-xs py-2 px-3 gap-1.5 flex-1 sm:flex-none"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Link Copied!' : 'Copy Meta Ad Link'}</span>
                </button>
              </div>

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
                    <span>Open Meta Ad Library</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
