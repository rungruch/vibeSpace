import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadFile } from '../../api/file.ts';
import { FileSubmit } from '../App/Interfaces/interface.ts';
import { createRoot } from 'react-dom/client';
import HTMLFlipBook from 'react-pageflip';
import styled from 'styled-components';

// Minimal Type declarations for PDF.js (avoid broad any where possible)
declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (url: string) => { promise: Promise<PDFDocumentProxy>};
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

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

// --- Singleton pdf.js loader (prevents multiple script attach / teardown) ---
const PDF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
let pdfjsLoadingPromise: Promise<typeof window.pdfjsLib | undefined> | null = null;
function ensurePdfjs(): Promise<typeof window.pdfjsLib | undefined> {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise;
  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDF_JS_CDN;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
        resolve(window.pdfjsLib);
      } else {
        resolve(undefined);
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return pdfjsLoadingPromise;
}

const FlipBookWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .flip-book {
    box-shadow: 0 0 20px rgba(0,0,0,0.2);
  }
  .page {
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  canvas {
    max-width: 100%;
    max-height: 100%;
  }
`;

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
  const [pdfjsReady, setPdfjsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef(0); // guards against race conditions
  const resizeTimeoutRef = useRef<number | null>(null);
  const flipbookRef = useRef<any>(null);
  const [flipKey, setFlipKey] = useState(0);

  // Load pdf.js only once (singleton) – no cleanup removing script (shared resource)
  useEffect(() => {
    let cancelled = false;
    ensurePdfjs()
      .then(() => { if (!cancelled) setPdfjsReady(true); })
      .catch((e) => { if (!cancelled) setError('Failed to load PDF library'); console.error(e); });
    return () => { cancelled = true; };
  }, []);

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
    if (!pdfUrl || !pdfjsReady || !window.pdfjsLib) return;
    setError(null);
    const myLoadId = ++loadIdRef.current;
    const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
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
  }, [pdfUrl, pdfjsReady, calculateDimensions]);

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
      try {
        const submit: FileSubmit = { type: file.type || 'application/pdf', uploaded_by: config.userId || 'anonymous', uploaded_at: new Date() };
        const res = await uploadFile(file, submit);
        const newUrl = res.staticUrl || res.url || '';
        if (newUrl) { setPdfUrl(newUrl); onDataChange({ ...data, file: { url: newUrl }, url: newUrl }); }
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

  if (readOnly) {
    return (
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
        <FlipBookWrapper>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {(!error && pdf && numPages > 0) && (
            <HTMLFlipBook
              width={(dimensions.width)/2}
              height={dimensions.height/2}
              className="flip-book"
              ref={flipbookRef}
              key={`flip-${flipKey}`}
              showCover={false}
              mobileScrollSupport
              size="fixed"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              maxHeight={1533}
              startPage={0}
              drawShadow
              flippingTime={800}
              usePortrait={false}
              startZIndex={0}
              autoSize
              maxShadowOpacity={1}
              showPageCorners
              disableFlipByClick={false}
              style={{}}
              clickEventForward
              useMouseEvents
              swipeDistance={30}
            >
              {renderPages()}
            </HTMLFlipBook>
          )}
        </FlipBookWrapper>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
  {!pdfUrl && (
        <div>
          <div>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{
                  border: '1px solid #ccc',
                  display: 'inline-block',
                  padding: '6px 12px',
                  cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Or enter a PDF URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                border: '1px solid #ccc',
                padding: '6px 12px',
                width: 'calc(100% - 80px)'
              }}
            />
            <button onClick={handleUrlSubmit} style={{ padding: '6px 12px' }}>
              Load
            </button>
          </div>
          
        </div>
      )}
      {pdfUrl && (
        <FlipBookWrapper>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!error && pdf && numPages > 0 ? (
            <HTMLFlipBook
              width={dimensions.width}
              height={dimensions.height}
              minWidth={200}
              maxWidth={dimensions.width}
              minHeight={200}
              maxHeight={dimensions.height}
              className="flip-book"
              ref={flipbookRef}
              key={`flip-${flipKey}`}
              showCover
              mobileScrollSupport
              size="stretch"
              startPage={0}
              drawShadow
              flippingTime={800}
              usePortrait
              startZIndex={0}
              autoSize
              maxShadowOpacity={1}
              showPageCorners
              disableFlipByClick={false}
              style={{ width: dimensions.width, height: dimensions.height, transition: 'width 0.3s, height 0.3s' }}
              clickEventForward
              useMouseEvents
              swipeDistance={30}
            >
              {renderPages()}
            </HTMLFlipBook>
          ) : !error && <p>Loading PDF...</p>}
        </FlipBookWrapper>
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
