import { Capacitor } from '@capacitor/core';
import type { PageInfo } from './draw';
import type { DrawPage, Paper } from '../worksheets/types';

export type PaperSize = 'A4' | 'Letter';

export interface CommonOptions {
  paper: PaperSize;
  childName: string;
  showNameLine: boolean;
  inkSaver: boolean;
}

export const PAPER: Record<PaperSize, Paper> = {
  A4: { W: 210, H: 297, margin: 12 },
  Letter: { W: 215.9, H: 279.4, margin: 12 },
};

let fontsReady: Promise<unknown> | null = null;
export function ensureFonts(): Promise<unknown> {
  fontsReady ??= Promise.all([
    ...['400 16px Andika', '700 16px Andika', '500 16px Fredoka', '600 16px Fredoka', '400 16px "Playwrite US Trad"'].map((f) => document.fonts.load(f)),
    document.fonts.load('500 16px "Noto Sans Devanagari"', 'क'),
    document.fonts.load('500 16px "Noto Sans Telugu"', 'క'),
  ]).catch(() => undefined);
  return fontsReady;
}

export function pageInfo(common: CommonOptions, i: number, count: number): PageInfo {
  const paper = PAPER[common.paper];
  return {
    ...paper,
    inkSaver: common.inkSaver,
    childName: common.childName.trim(),
    showNameLine: common.showNameLine,
    pageNumber: i + 1,
    pageCount: count,
  };
}

/** Render one page onto `canvas` at `pxPerMm` resolution. */
export function renderPage(canvas: HTMLCanvasElement, draw: DrawPage, info: PageInfo, pxPerMm: number) {
  canvas.width = Math.round(info.W * pxPerMm);
  canvas.height = Math.round(info.H * pxPerMm);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(pxPerMm, pxPerMm);
  draw(ctx, info);
}

const PRINT_PX_PER_MM = 200 / 25.4; // 200 dpi is crisp for pencil work and keeps files small

export async function buildPdf(pages: DrawPage[], common: CommonOptions, onProgress?: (done: number) => void) {
  await ensureFonts();
  const { jsPDF } = await import('jspdf');
  const paper = PAPER[common.paper];
  const pdf = new jsPDF({ unit: 'mm', format: [paper.W, paper.H], orientation: 'portrait', compress: true });
  const canvas = document.createElement('canvas');
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage([paper.W, paper.H], 'portrait');
    renderPage(canvas, pages[i], pageInfo(common, i, pages.length), PRINT_PX_PER_MM);
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, paper.W, paper.H, undefined, 'FAST');
    onProgress?.(i + 1);
    // let the UI breathe between pages
    await new Promise((r) => setTimeout(r, 0));
  }
  pdf.setProperties({ title: 'PaperKid worksheet', creator: 'PaperKid' });
  return pdf;
}

type Pdf = Awaited<ReturnType<typeof buildPdf>>;

/** Save the PDF: browser download on the web, share sheet (Files, Print, Drive…) in the native app. */
export async function savePdf(pdf: Pdf, fileName: string) {
  const name = `${fileName}.pdf`;
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const data = pdf.output('datauristring').split(',')[1];
    const res = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
    await Share.share({ title: name, url: res.uri, dialogTitle: 'Save or print your worksheet' });
    return;
  }
  pdf.save(name);
}

/** Open the browser print dialog for the PDF (falls back to a new tab). */
export async function printPdf(pdf: Pdf, fileName: string) {
  if (Capacitor.isNativePlatform()) return savePdf(pdf, fileName);
  const url = pdf.output('bloburl') as unknown as string;
  // Mobile Safari can't print a PDF from a hidden frame; show it in a tab with its own print/share button.
  if (/iP(hone|ad|od)|Android/.test(navigator.userAgent)) {
    window.open(url, '_blank');
    return;
  }
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  frame.src = url;
  document.body.appendChild(frame);
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
    setTimeout(() => frame.remove(), 60_000);
  };
}
