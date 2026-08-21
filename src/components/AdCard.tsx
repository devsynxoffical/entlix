'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Tag, MapPin, Star, MessageSquare, Eye, Globe, ImageOff } from 'lucide-react';
import { resolveAdCreativeUrl, resolveSourceLink } from '@/lib/adCreative';

export default function AdCard({
  ad,
  onSelect,
  onOpenDossier,
  onFavoriteToggle,
}: {
  ad: any;
  onSelect: (ad: any) => void;
  onOpenDossier: (name: string) => void;
  onFavoriteToggle: (id: string, isFav: boolean) => void;
}) {
  const isNew = ad.classification === 'NEW';
  const whatsappCleanNumber = ad.whatsappContact ? ad.whatsappContact.replace(/[^0-9]/g, '') : null;
  const whatsappUrl = whatsappCleanNumber ? `https://wa.me/${whatsappCleanNumber}` : null;
  const liveAdUrl = resolveSourceLink(ad.sourceLink, ad.metaAdId);
  const [imgSrc, setImgSrc] = useState(() =>
    resolveAdCreativeUrl(ad.adCreativeUrl, ad.matchingKeyword)
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(resolveAdCreativeUrl(ad.adCreativeUrl, ad.matchingKeyword));
    setImgFailed(false);
  }, [ad.id, ad.adCreativeUrl, ad.matchingKeyword]);

  return (
    <div
      onClick={() => onSelect(ad)}
      className="glass-card overflow-hidden flex flex-col justify-between border border-slate-200/80 hover:border-purple-300 transition-all shadow-sm hover:shadow-md cursor-pointer group relative bg-white"
    >
      <div>
        {/* Card Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-start gap-2 bg-slate-50/60">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDossier(ad.advertiserName);
            }}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity flex-1"
            title="Click to view Competitor Brand Portfolio"
          >
            {ad.advertiserLogo ? (
              <img
                src={ad.advertiserLogo}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {ad.advertiserName ? ad.advertiserName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-900 font-bold truncate group-hover:text-purple-600 transition-colors">
                  {ad.advertiserName}
                </span>
                <span className={`badge shrink-0 ${isNew ? 'badge-new' : 'badge-existing'}`}>
                  {ad.classification}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Sponsored</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(ad.id, !ad.isFavorite);
              }}
              className={`p-1.5 rounded-lg transition-colors ${ad.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
              title={ad.isFavorite ? 'Bookmarked in Favorites' : 'Add to Favorites'}
            >
              <Star size={15} className={ad.isFavorite ? 'fill-amber-400' : ''} />
            </button>
            {liveAdUrl && (
              <a
                href={liveAdUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-purple-600 transition-colors p-1.5"
                title="Open in Meta Ad Library"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        {/* Creative Image Preview */}
        <div className="p-4 pb-2">
          <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-200/60 relative">
            {!imgFailed ? (
              <img
                src={imgSrc}
                alt="Ad creative"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => {
                  const fallback = resolveAdCreativeUrl(null, ad.matchingKeyword);
                  if (imgSrc !== fallback) {
                    setImgSrc(fallback);
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 px-4 text-center">
                <ImageOff size={28} />
                <span className="text-xs font-medium">Creative preview unavailable</span>
              </div>
            )}
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-white text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                <Eye size={14} className="text-purple-600" /> Inspect Full Ad
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 line-clamp-3 mb-3 font-normal">
            {ad.adText || 'No ad description available for this placement.'}
          </p>

          {ad.advertiserLink && (
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg w-fit max-w-full border border-slate-200/60">
              <Globe size={13} className="text-purple-600 shrink-0" />
              <span className="truncate">{ad.advertiserLink}</span>
            </div>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full mb-2 btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <MessageSquare size={14} />
              <span className="truncate">Chat on WhatsApp ({ad.whatsappContact})</span>
            </a>
          )}
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-3 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <Tag size={12} className="text-purple-500 shrink-0" />
          <span className="truncate">#{ad.matchingKeyword}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate justify-end">
          <MapPin size={12} className="text-cyan-500 shrink-0" />
          <span className="truncate">{ad.region}</span>
        </div>
      </div>
    </div>
  );
}
