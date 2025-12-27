'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';
import { getPlaceholderGradient } from '@/lib/images';

interface ImageLightboxProps {
  src: string;
  alt: string;
  thumbnailClassName?: string;
  fallbackName?: string;
  /** Query to search Unsplash (if provided, will fetch from API) */
  searchQuery?: string;
  /** Type of image for search context */
  searchType?: 'spot' | 'activity';
}

export function ImageLightbox({
  src,
  alt,
  thumbnailClassName,
  fallbackName,
  searchQuery,
  searchType = 'spot',
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(src);

  // Fetch real image from Unsplash API if searchQuery is provided
  useEffect(() => {
    if (!searchQuery) return;

    const fetchImage = async () => {
      try {
        const response = await fetch(
          `/api/images?query=${encodeURIComponent(searchQuery)}&type=${searchType}`
        );
        const data = await response.json();
        if (data.url) {
          setImageUrl(data.url);
        }
      } catch {
        // Keep using fallback src on error
      }
    };

    fetchImage();
  }, [searchQuery, searchType]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const gradient = fallbackName ? getPlaceholderGradient(fallbackName) : 'from-slate-400 to-slate-500';

  if (imageError) {
    return (
      <div
        className={`bg-gradient-to-br ${gradient} ${thumbnailClassName}`}
        aria-label={alt}
      />
    );
  }

  // Render lightbox modal using portal to avoid nesting buttons
  const lightboxModal = isOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Large image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {alt} · Click anywhere or press ESC to close
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Thumbnail - no role="button" since parent may already be a button */}
      <div
        className={`relative cursor-pointer group ${thumbnailClassName}`}
        onClick={() => setIsOpen(true)}
        aria-label={`View larger image of ${alt}`}
      >
        {isLoading && (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse`} />
        )}
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          sizes="(max-width: 768px) 100vw, 300px"
          onLoad={() => setIsLoading(false)}
          onError={() => setImageError(true)}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
            Click to enlarge
          </span>
        </div>
      </div>

      {/* Lightbox Modal - rendered via portal */}
      {lightboxModal}
    </>
  );
}
