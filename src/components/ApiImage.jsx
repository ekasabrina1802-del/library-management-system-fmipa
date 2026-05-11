import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true'
};

function joinUrl(base, path) {
  if (!base) return path;
  if (!path) return base;

  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function buildImageUrl(src) {
  if (!src) return null;

  if (
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  ) {
    return src;
  }

  return joinUrl(API_URL, src);
}

function isApiUrl(url) {
  if (!API_URL || !url) return false;
  return url.startsWith(API_URL.replace(/\/$/, ''));
}

export default function ApiImage({
  src,
  alt = '',
  fallback = null,
  style,
  className,
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setError(false);
      return;
    }

    const finalUrl = buildImageUrl(src);

    if (!finalUrl) {
      setImageSrc(null);
      setError(false);
      return;
    }

    if (
      finalUrl.startsWith('blob:') ||
      finalUrl.startsWith('data:')
    ) {
      setImageSrc(finalUrl);
      setError(false);
      return;
    }

    let active = true;
    let objectUrl = null;

    async function loadImage() {
      try {
        setError(false);
        setImageSrc(null);

        const res = await fetch(finalUrl, {
          headers: isApiUrl(finalUrl) ? ngrokHeaders : undefined
        });

        if (!res.ok) {
          throw new Error(`Gagal load image: ${res.status}`);
        }

        const blob = await res.blob();

        if (!blob.type.startsWith('image/')) {
          throw new Error(`Response bukan gambar: ${blob.type || 'unknown'}`);
        }

        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error('ApiImage error:', err);
        if (active) {
          setError(true);
          setImageSrc(null);
        }
      }
    }

    loadImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (error || !src) {
    return fallback;
  }

  if (!imageSrc) {
    return fallback;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      {...props}
    />
  );
}