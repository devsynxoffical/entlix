'use client';

import { useEffect, useRef, useState } from 'react';
import {
  isDisplayableImageUrl,
  isPlaceholderCreativeUrl,
  isRealMetaAdId,
  metaPreviewPath,
  pickCreativeImageFromDocument,
} from '@/lib/adCreative';

type Props = {
  adId?: string;
  metaAdId?: string | null;
  adCreativeUrl?: string | null;
  variant?: 'card' | 'modal';
  className?: string;
};

export default function AdCreativePreview({
  adId,
  metaAdId,
  adCreativeUrl,
  variant = 'card',
  className = '',
}: Props) {
  const isMetaAd = isRealMetaAdId(metaAdId);
  const hasStoredImage =
    isDisplayableImageUrl(adCreativeUrl) && !isPlaceholderCreativeUrl(adCreativeUrl);

  const [imgSrc, setImgSrc] = useState<string | null>(() =>
    hasStoredImage ? (adCreativeUrl as string) : null
  );
  const [loading, setLoading] = useState(isMetaAd && !hasStoredImage);
  const [inView, setInView] = useState(variant === 'modal');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cachedRef = useRef(false);

  const previewPath = metaPreviewPath(metaAdId);
  const extracting = isMetaAd && !hasStoredImage && loading && inView && !!previewPath;

  useEffect(() => {
    if (hasStoredImage) {
      setImgSrc(adCreativeUrl as string);
      setLoading(false);
      return;
    }

    if (!isMetaAd) {
      setImgSrc(null);
      setLoading(false);
      return;
    }

    setImgSrc(null);
    setLoading(true);
    cachedRef.current = false;
  }, [adCreativeUrl, hasStoredImage, isMetaAd]);

  useEffect(() => {
    if (variant === 'modal' || hasStoredImage || !isMetaAd) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [variant, hasStoredImage, isMetaAd, imgSrc]);

  useEffect(() => {
    if (!extracting) return;

    let attempts = 0;
    const maxAttempts = 24;

    const tryExtract = () => {
      attempts += 1;
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;

        const extracted = pickCreativeImageFromDocument(doc);
        if (extracted) {
          setImgSrc(extracted);
          setLoading(false);

          if (adId && !cachedRef.current) {
            cachedRef.current = true;
            fetch(`/api/ads/${adId}/creative`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: extracted }),
            }).catch(() => {});
          }
          return;
        }
      } catch {
        // not ready yet
      }

      if (attempts >= maxAttempts) {
        setLoading(false);
      }
    };

    const timer = window.setInterval(tryExtract, 500);
    return () => window.clearInterval(timer);
  }, [adId, extracting]);

  const imgClass =
    variant === 'modal'
      ? 'w-full h-full object-contain bg-slate-900/5'
      : 'w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300';

  const containerClass =
    variant === 'modal'
      ? 'w-full aspect-[4/3] max-h-80 bg-slate-100 overflow-hidden border-y border-slate-200/80'
      : 'w-full aspect-[4/3] mb-3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200/60 relative';

  if (!imgSrc) {
    return (
      <>
        {variant === 'card' && isMetaAd && !hasStoredImage && (
          <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
        )}
        {extracting && (
          <iframe
            ref={iframeRef}
            src={previewPath!}
            title=""
            aria-hidden
            tabIndex={-1}
            className="absolute w-px h-px opacity-0 pointer-events-none overflow-hidden"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </>
    );
  }

  return (
    <>
      {variant === 'card' && isMetaAd && !hasStoredImage && (
        <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      )}
      <div className={`${containerClass} ${className}`}>
        <img
          src={imgSrc}
          alt="Ad creative"
          className={imgClass}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgSrc(null)}
        />
      </div>
    </>
  );
}
