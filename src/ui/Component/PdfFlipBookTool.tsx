import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadFile } from '../../api/file.ts';
import { FileSubmit } from '../App/Interfaces/interface.ts';
import { createRoot } from 'react-dom/client';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker using local file (copied by webpack)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewport { width: number; height: number; }
interface PDFRenderTask { cancel: () => void; promise: Promise<void>; }
interface PDFPageProxy {
  getViewport: (opts: { scale: number }) => PDFViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => PDFRenderTask;
}
interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

// Using Tailwind utility classes instead of styled-components.
// The wrapper and page styles are applied inline via className where needed.

interface PdfFlipBookToolData {
  file?: {
    url: string;
  };
  url?: string;
}

interface PdfFlipBookToolProps {
  data: PdfFlipBookToolData;
  api: any;
  readOnly: boolean;
  config: { userId?: string },
  onDataChange: (data: PdfFlipBookToolData) => void;
}

const PdfFlipBookComponent: React.FC<PdfFlipBookToolProps> = ({ data, api, readOnly, config, onDataChange }) => {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(data.file?.url || data.url || '');
  const [dimensions, setDimensions] = useState({ width: 500, height: 700, scale: 1 });
  const [urlInput, setUrlInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef(0); // guards against race conditions
  const resizeTimeoutRef = useRef<number | null>(null);
  const flipbookRef = useRef<any>(null);
  const [flipKey, setFlipKey] = useState(0);

  // Helper to calculate dimensions based on container width
  const calculateDimensions = useCallback(async (pdfInstance: PDFDocumentProxy) => {
    if (!pdfInstance || pdfInstance.numPages === 0) return;
    try {
      const page = await pdfInstance.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth = (wrapperRef.current?.clientWidth || 500);
      const maxLogicalWidth = 1200;
      const targetWidth = Math.min(containerWidth, maxLogicalWidth);
      const scale = targetWidth / baseViewport.width;
      const scaledViewport = page.getViewport({ scale });
      setDimensions((prev) => {
        // Only update if width or height changes by more than 400px
        if (
          Math.abs(prev.width - scaledViewport.width) > 400 ||
          Math.abs(prev.height - scaledViewport.height) > 400 ||
          Math.abs(prev.scale - scale) > 0.01
        ) {
          return { width: scaledViewport.width, height: scaledViewport.height, scale };
        }
        return prev;
      });
    } catch (e) {
      console.warn('calculateDimensions failed', e);
    }
  }, []);

  useEffect(() => {
    if (!pdfUrl) return;
    setError(null);
    const myLoadId = ++loadIdRef.current;
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then(async (pdfInstance) => {
        if (myLoadId !== loadIdRef.current) return; // stale load ignored
        setPdf(pdfInstance);
        setNumPages(pdfInstance.numPages);
        await calculateDimensions(pdfInstance);
      })
      .catch((e: any) => {
        if (myLoadId !== loadIdRef.current) return;
        console.error('PDF load failed', e);
        setError('Failed to load PDF.');
        setPdf(null);
        setNumPages(0);
      });
  }, [pdfUrl, calculateDimensions]);

  // When dimensions update, try to call flipbook update; if not available, force remount
  useEffect(() => {
    // short debounce to allow dimensions to settle
    const t = setTimeout(() => {
      try {
        if (flipbookRef.current && typeof flipbookRef.current.update === 'function') {
          flipbookRef.current.update();
        } else {
          // force remount as a fallback
          setFlipKey(k => k + 1);
        }
      } catch (e) {
        setFlipKey(k => k + 1);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [dimensions.width, dimensions.height]);

  // Responsive resize (debounced with setTimeout for better performance)
  useEffect(() => {
    if (!pdf) return;
    // Use ResizeObserver if available to detect container size changes
    let ro: ResizeObserver | null = null;
  const scheduleCalc = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = window.setTimeout(() => {
        calculateDimensions(pdf);
      }, 100);
    };

    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          scheduleCalc();
        }
      });
      ro.observe(wrapperRef.current);
    } else {
      // fallback to window resize
      const handleResize = () => scheduleCalc();
      window.addEventListener('resize', handleResize);
      // initial schedule
      scheduleCalc();
      return () => window.removeEventListener('resize', handleResize);
    }

    return () => {
      if (ro && wrapperRef.current) ro.unobserve(wrapperRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [pdf, calculateDimensions]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setUploading(true);
      try {
        const submit: FileSubmit = { type: file.type || 'application/pdf', uploaded_by: config.userId || 'anonymous', uploaded_at: new Date() };
        const res = await uploadFile(file, submit);
        const newUrl = res.staticUrl || res.url || '';
        if (newUrl) {
          setPdfUrl(newUrl);
          onDataChange({ ...data, file: { url: newUrl }, url: newUrl });
        }
        setUploading(false);
      } catch (e) { console.error('PDF upload failed', e); }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPdfUrl(urlInput);
      onDataChange({ url: urlInput });
    }
  };

  const renderPages = useCallback(() => {
    if (!pdf) return null;
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(<Page key={i} pageNumber={i} pdf={pdf} scale={dimensions.scale} />);
    }
    return pages;
  }, [numPages, pdf, dimensions.scale]);

  // Use a single, shared flipbook configuration so readOnly and edit mode render the same
  const flipbookProps = {
    // size + dims vary by readOnly; keep other props shared
    width:  Math.round(dimensions.width / 2),
    height: Math.round(dimensions.height / 2),
    className: 'flip-book shadow-lg',
    ref: flipbookRef,
    key: `flip-${flipKey}`,
    showCover: false,
    mobileScrollSupport: true,
    size: ('fixed' as 'fixed'),
    minWidth: 315,
    maxWidth: 1000,
    minHeight: 400,
    maxHeight: 1533,
    startPage: 0,
    drawShadow: true,
    flippingTime: 800,
    usePortrait: false,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 1,
    showPageCorners: true,
    disableFlipByClick: false,
    clickEventForward: true,
    useMouseEvents: true,
    swipeDistance: 30,
    style: {},
  };

  // Single render path: controls (when no pdfUrl) and a single HTMLFlipBook instance

  return (
    <div ref={wrapperRef} className="w-full h-full">
      {!pdfUrl && (
        <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded shadow-sm border">
          <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700">Upload PDF file</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="border border-gray-300 px-3 py-2 cursor-pointer rounded text-sm text-gray-700"
              aria-describedby="file-help"
            />
            <div className="text-sm text-gray-500" id="file-help">
              {selectedFileName ? (
                <span className="flex items-center gap-2"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd"/></svg>{selectedFileName}</span>
              ) : (
                <span>No file chosen</span>
              )}
            </div>
            {uploading && (
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path></svg>
            )}
          </div>

          <div className="mt-4 sm:flex sm:items-center sm:gap-3">
            <label htmlFor="pdf-url" className="sr-only">PDF URL</label>
            <input
              id="pdf-url"
              type="text"
              placeholder="Or enter a PDF URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full sm:flex-1 text-sm"
            />
            <button onClick={handleUrlSubmit} className="mt-2 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Load</button>
          </div>
        </div>
      )}
      {pdfUrl && (
        <div className="w-full h-full flex items-center justify-center">
          {error && <p className="text-red-500">{error}</p>}
          {!error && pdf && numPages > 0 ? (
            <HTMLFlipBook {...flipbookProps}>
              {renderPages()}
            </HTMLFlipBook>
          ) : !error && <p>Loading PDF...</p>}
        </div>
      )}
    </div>
  );
};

const Page = React.forwardRef<HTMLDivElement, { pageNumber: number; pdf: PDFDocumentProxy; scale: number }>(({ pageNumber, pdf, scale }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScaleRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: PDFRenderTask | null = null;
    // Avoid rerendering if scale change is negligible (<1%)
    if (lastScaleRef.current !== null && Math.abs(scale - lastScaleRef.current) / (lastScaleRef.current || 1) < 0.01) {
      return; // skip tiny scale change
    }
    lastScaleRef.current = scale;
    if (pdf) {
      pdf.getPage(pageNumber).then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            renderTask = page.render({ canvasContext: context, viewport });
            renderTask.promise.catch((e: any) => {
              // Suppress expected cancellation noise
              if (e?.name !== 'RenderingCancelledException') {
                console.warn(`Page ${pageNumber} render error`, e);
              }
            });
          }
        }
      }).catch((e) => console.warn('Page render failed', e));
    }
    return () => {
      cancelled = true;
      if (renderTask) {
        try { renderTask.cancel(); } catch {}
      }
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div ref={ref} className="page">
      <canvas ref={canvasRef} />
    </div>
  );
});

export default class PdfFlipBookTool {
  private api: any;
  private readOnly: boolean;
  private config: any;
  private data: PdfFlipBookToolData;
  private wrapper: HTMLElement | null;
  private root: any;

  constructor({ data, api, readOnly, config }: { data: PdfFlipBookToolData, api: any, readOnly: boolean, config: any }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.data = data || { file: { url: '' } };
    this.wrapper = null;
    this.root = null;
  }

  static get toolbox() {
    return {
      title: 'PDF FlipBook',
      icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.53C16.97 3.53 21 7.56 21 12.53C21 17.5 16.97 21.53 12 21.53C7.03 21.53 3 17.5 3 12.53C3 7.56 7.03 3.53 12 3.53ZM12 2.53C6.47 2.53 2 7 2 12.53C2 18.06 6.47 22.53 12 22.53C17.53 22.53 22 18.06 22 12.53C22 7 17.53 2.53 12 2.53Z" fill="currentColor"/><path d="M12 5.53C9.24 5.53 7 8.76 7 12.53C7 16.3 9.24 19.53 12 19.53C14.76 19.53 17 16.3 17 12.53C17 8.76 14.76 5.53 12 5.53Z" fill="currentColor"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  render() {
    this.wrapper = document.createElement('div');
    this.root = createRoot(this.wrapper);
    this.root.render(
        <PdfFlipBookComponent 
            data={this.data} 
            api={this.api} 
            readOnly={this.readOnly} 
            config={this.config}
            onDataChange={(newData) => {
                this.data = newData;
            }}
        />
    );
    return this.wrapper;
  }

  save() {
    return this.data;
  }

  // Ensure React tree is unmounted when EditorJS disposes the tool instance
  destroy() {
    try { this.root?.unmount(); } catch {}
    this.wrapper = null;
  }
}
