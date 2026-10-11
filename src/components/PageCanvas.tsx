import { useEffect, useRef, useState } from 'react';
import type { PageInfo } from '../lib/draw';
import { ensureFonts, renderPage } from '../lib/render';
import type { DrawPage } from '../worksheets/types';

interface Props {
  draw: DrawPage;
  info: PageInfo;
  /** CSS width the page is shown at; rendering resolution follows it. */
  cssWidth: number;
  label?: string;
}

/** A single worksheet page, rendered lazily when scrolled into view. */
export function PageCanvas({ draw, info, cssWidth, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !ref.current) return;
    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ensureFonts().then(() => {
      if (!cancelled && ref.current) renderPage(ref.current, draw, info, (cssWidth / info.W) * dpr);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, draw, info, cssWidth]);

  return (
    <canvas
      ref={ref}
      className="page"
      aria-label={label}
      style={{ width: cssWidth, aspectRatio: `${info.W} / ${info.H}` }}
    />
  );
}
