// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Expanding gallery (expanding-gallery)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { ImageOff } from 'lucide-react';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  /** Intrinsic dimensions keep the thumbnail and expanded image in the same proportions. */
  width: number;
  height: number;
  meta?: string;
}

export function GalleryPicture({ image, eager = false }: { image: GalleryImage; eager?: boolean }) {
  const [failed, setFailed] = React.useState(false);
  return failed ? (
    <div role="img" aria-label={`${image.alt} (image unavailable)`} className="flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
      <ImageOff className="size-6" aria-hidden="true" /><span className="text-xs">Image unavailable</span>
    </div>
  ) : (
    <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
      onError={() => setFailed(true)} className="size-full object-cover" />
  );
}
