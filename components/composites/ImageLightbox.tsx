"use client";

import Image from "next/image";
import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";

interface ImageLightboxProps {
  /** The full image, a path under /public. */
  src: string;
  alt: string;
  /** The image's intrinsic size. */
  width: number;
  height: number;
  /** The thumbnail, as the article shows it. */
  children: ReactNode;
  className?: string;
}

/**
 * Wraps an article image so a click enlarges it over the page instead
 * of leaving for a new tab. The enlarged view is a native modal
 * <dialog>: Escape closes it, focus returns to the thumbnail, and the
 * page behind is inert. A click anywhere closes it, and so does a
 * scroll, so the reader is never stranded away from where they were.
 *
 * The thumbnail stays a real link to the file. Without JavaScript it
 * still opens the image, and a modified click (Ctrl, Cmd, middle
 * button) still opens a new tab.
 */
export default function ImageLightbox({
  src,
  alt,
  width,
  height,
  children,
  className = "",
}: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const close = () => dialog.close();
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  return (
    <>
      <a
        href={src}
        onClick={show}
        aria-haspopup="dialog"
        aria-label={`Enlarge image: ${alt}`}
        className={`unstyled-link relative block cursor-zoom-in ${className}`}
      >
        {children}
      </a>
      {open && (
        // Mounted only while open, so the full-size file loads on demand.
        // The dialog itself keeps its UA display rule (hidden until
        // showModal), so the layout lives on the inner wrapper.
        <dialog
          ref={dialogRef}
          aria-label={alt || "Enlarged image"}
          onClose={() => setOpen(false)}
          onClick={() => dialogRef.current?.close()}
          className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none cursor-zoom-out border-0 bg-transparent p-3 backdrop:bg-base/90 backdrop:backdrop-blur-sm sm:p-8"
        >
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              // The file as it is on disk: this view exists to show the
              // detail the column-width thumbnail loses.
              unoptimized
              className="h-auto max-h-full w-auto max-w-full rounded-lg border border-line/60 object-contain shadow-[0_18px_55px_rgba(0,0,0,0.5)]"
            />
          </div>
          <button
            type="button"
            className="absolute right-3 top-3 cursor-pointer rounded-full border border-line/70 bg-glass/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink backdrop-blur-sm transition-colors hover:border-accent/70 hover:text-accent sm:right-5 sm:top-5"
          >
            Close
          </button>
        </dialog>
      )}
    </>
  );
}
