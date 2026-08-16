import React from "react";

export const SACRED_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=85";
export const SACRED_HERITAGE_FALLBACK = "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=85";

export function handleImgError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = SACRED_IMAGE_FALLBACK,
) {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
