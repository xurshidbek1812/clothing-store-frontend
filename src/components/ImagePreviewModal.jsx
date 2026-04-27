import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

function resolveImageUrl(url) {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

export default function ImagePreviewModal({
  open,
  imageUrl,
  images = [],
  title,
  onClose,
}) {
  const normalizedImages = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      return images
        .map((item) =>
          typeof item === 'string'
            ? { imageUrl: resolveImageUrl(item) }
            : {
                ...item,
                imageUrl: resolveImageUrl(item?.imageUrl || ''),
              }
        )
        .filter((item) => item.imageUrl);
    }

    if (imageUrl) {
      return [{ imageUrl: resolveImageUrl(imageUrl) }];
    }

    return [];
  }, [images, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open, normalizedImages.length]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }

      if (normalizedImages.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }

      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) =>
          prev < normalizedImages.length - 1 ? prev + 1 : prev
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, normalizedImages.length, onClose]);

  const currentImage = normalizedImages[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === normalizedImages.length - 1;

  const visibleThumbnails = useMemo(() => {
    const total = normalizedImages.length;

    if (total <= 3) {
      return normalizedImages.map((item, index) => ({
        ...item,
        realIndex: index,
      }));
    }

    let start = currentIndex - 1;

    if (start < 0) start = 0;
    if (start > total - 3) start = total - 3;

    return normalizedImages.slice(start, start + 3).map((item, idx) => ({
      ...item,
      realIndex: start + idx,
    }));
  }, [normalizedImages, currentIndex]);

  const showPrev = () => {
    if (isFirst) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const showNext = () => {
    if (isLast) return;
    setCurrentIndex((prev) => prev + 1);
  };

  if (!open || !normalizedImages.length || !currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[92vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
        >
          ✕
        </button>

        {normalizedImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrev}
              disabled={isFirst}
              className={`absolute left-3 top-[38%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition ${
                isFirst
                  ? 'cursor-not-allowed bg-white/50 text-slate-400'
                  : 'bg-white/90 text-slate-700 hover:bg-white'
              }`}
            >
              <ArrowLeft size={18} />
            </button>

            <button
              type="button"
              onClick={showNext}
              disabled={isLast}
              className={`absolute right-3 top-[38%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition ${
                isLast
                  ? 'cursor-not-allowed bg-white/50 text-slate-400'
                  : 'bg-white/90 text-slate-700 hover:bg-white'
              }`}
            >
              <ArrowRight size={18} />
            </button>
          </>
        ) : null}

        <div className="overflow-hidden rounded-3xl bg-white p-2 shadow-2xl">
          <img
            src={currentImage.imageUrl}
            alt={title || 'Preview'}
            className="max-h-[68vh] max-w-[85vw] rounded-2xl object-contain"
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          {title ? (
            <div className="text-center text-sm font-semibold text-white">
              {title}
            </div>
          ) : null}

          {normalizedImages.length > 1 ? (
            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {currentIndex + 1} / {normalizedImages.length}
            </div>
          ) : null}
        </div>

        {normalizedImages.length > 1 ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-md">
            {visibleThumbnails.map((item) => (
              <button
                key={item.id || item.realIndex}
                type="button"
                onClick={() => setCurrentIndex(item.realIndex)}
                className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  currentIndex === item.realIndex
                    ? 'border-white'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={`preview-${item.realIndex + 1}`}
                  className="h-16 w-16 object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}