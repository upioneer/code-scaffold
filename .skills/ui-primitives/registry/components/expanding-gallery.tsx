// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Expanding gallery (expanding-gallery)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { GalleryViewer } from './gallery-viewer';
import { GalleryPicture, type GalleryImage } from './gallery-picture';
import { INTERACTION_FOCUS } from './ui-interaction-motion';
import { NumberRoll } from './number-roll';

export type { GalleryImage } from './gallery-picture';

export interface ExpandingGalleryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  images: GalleryImage[];
  label?: string;
  onImageChange?: (image: GalleryImage | null) => void;
}

/** An image keeps its identity from the thumbnail to the viewer and back. */
export function ExpandingGallery({ images, label = 'Selected work', onImageChange, className = '', ...props }: ExpandingGalleryProps) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const frames = React.useRef(new Map<string, HTMLDivElement>());
  const triggers = React.useRef(new Map<string, HTMLButtonElement>());
  const openingRect = React.useRef<DOMRect | null>(null);
  const index = images.findIndex((image) => image.id === selected);
  const visible = index >= 0;

  const select = (next: number) => {
    const image = images[next];
    if (!image) return;
    if (selected === null) openingRect.current = frames.current.get(image.id)?.getBoundingClientRect() ?? null;
    setSelected(image.id);
    onImageChange?.(image);
  };
  const close = () => {
    setSelected(null);
    onImageChange?.(null);
    // Focus returns to the thumbnail of the image you were on, including after browsing.
    triggers.current.get(selected ?? '')?.focus({ preventScroll: true });
  };

  return (
    <div className={`w-full text-foreground ${className}`} {...props}>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><NumberRoll value={images.length} format={{ minimumIntegerDigits: 2 }} /> studies</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4">
        {images.map((image, i) => (
          <button key={image.id} type="button" aria-label={`Open ${image.title}`} aria-haspopup="dialog"
            ref={(el) => { if (el) triggers.current.set(image.id, el); else triggers.current.delete(image.id); }}
            onClick={() => select(i)} className={`group min-w-0 cursor-zoom-in rounded-2xl text-left ${INTERACTION_FOCUS}`}>
            <div ref={(el) => { if (el) frames.current.set(image.id, el); else frames.current.delete(image.id); }}
              className="relative overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: `${Math.max(1, image.width)} / ${Math.max(1, image.height)}`, visibility: visible && selected === image.id ? 'hidden' : undefined }}>
              <div className="size-full transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none">
                <GalleryPicture key={image.src} image={image} />
              </div>
              <span className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <span className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
              <span className="truncate text-[12px] font-medium">{image.title}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            </span>
            {image.meta && <span className="mt-0.5 block truncate px-0.5 text-[11px] text-muted-foreground">{image.meta}</span>}
          </button>
        ))}
      </div>
      {visible && <GalleryViewer images={images} index={index} label={label} openingRect={openingRect.current} getOrigin={(id) => frames.current.get(id)} onSelect={select} onClose={close} />}
    </div>
  );
}
