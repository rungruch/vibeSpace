import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { uploadFile } from '../../api/file.ts';
import { FileSubmit } from '../App/Interfaces/interface.ts';
import { createRoot } from 'react-dom/client';
import HTMLFlipBook from 'react-pageflip';
// Use pdf.js from CDN only (no local pdfjs-dist)
const PDFJS_VERSION = '5.4.54';
type PdfJsLib = any;
const loadPdfJs = (() => {
  let promise: Promise<PdfJsLib> | null = null;
  return () => {
    if (!promise) {
      promise = import(/* webpackIgnore: true */ `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`)
        .then((mod: any) => {
          if (mod?.GlobalWorkerOptions) {
            mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
          }
          return mod;
        });
    }
    return promise;
  };
})();

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
  const [currentPage, setCurrentPage] = useState(0); // Track current page for debugging
  
  // Canvas pool for reusing canvas elements with memory monitoring
  const canvasPoolRef = useRef<HTMLCanvasElement[]>([]);
  const memoryStatsRef = useRef({ activeCanvases: 0, poolSize: 0, renderCount: 0 });
  
  const getCanvasFromPool = useCallback(() => {
    memoryStatsRef.current.activeCanvases++;
    if (canvasPoolRef.current.length > 0) {
      const canvas = canvasPoolRef.current.pop()!;
      memoryStatsRef.current.poolSize--;
      return canvas;
    }
    return document.createElement('canvas');
  }, []);
  
  const returnCanvasToPool = useCallback((canvas: HTMLCanvasElement) => {
    // Clear canvas and return to pool with memory limits
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
    
    memoryStatsRef.current.activeCanvases--;
    
    // Adaptive pool size based on memory pressure
    const maxPoolSize = window.innerWidth < 768 ? 5 : 10; // Smaller pool on mobile
    if (canvasPoolRef.current.length < maxPoolSize) {
      canvasPoolRef.current.push(canvas);
      memoryStatsRef.current.poolSize++;
    }
    
    // Memory pressure detection (simple heuristic)
    if (memoryStatsRef.current.renderCount % 50 === 0 && 'memory' in performance) {
      try {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.8) {
          // High memory usage - clear half the pool
          const poolToClear = Math.floor(canvasPoolRef.current.length / 2);
          canvasPoolRef.current.splice(0, poolToClear);
          memoryStatsRef.current.poolSize -= poolToClear;
        }
      } catch (e) {
        // Memory API not available or failed
      }
    }
  }, []);

  // Helper to calculate dimensions based on container width
  const calculateDimensions = useCallback(async (pdfInstance: PDFDocumentProxy) => {
    if (!pdfInstance || pdfInstance.numPages === 0) return;
    try {
      const page = await pdfInstance.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth = (wrapperRef.current?.clientWidth || 500);
      const maxLogicalWidth = 1600; // Increased from 1200
      const targetWidth = Math.min(containerWidth, maxLogicalWidth);
      const scale = targetWidth / baseViewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      setDimensions((prev) => {
        // Smart responsive thresholds based on container size
        const isMobile = containerWidth < 768;
        const isTablet = containerWidth >= 768 && containerWidth < 1024;
        
        // More responsive on mobile/tablet, less on desktop to prevent memory churn
        const widthThreshold = isMobile ? 50 : isTablet ? 100 : 200;
        const heightThreshold = isMobile ? 50 : isTablet ? 100 : 200;
        const scaleThreshold = isMobile ? 0.05 : 0.02;
        
        // Check if changes are significant enough
        const widthChange = Math.abs(prev.width - scaledViewport.width);
        const heightChange = Math.abs(prev.height - scaledViewport.height);
        const scaleChange = Math.abs(prev.scale - scale);
        
        if (
          widthChange > widthThreshold ||
          heightChange > heightThreshold ||
          scaleChange > scaleThreshold
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
    let cancelled = false;
    loadPdfJs()
      .then((lib) => {
        if (cancelled) return;
        const loadingTask = lib.getDocument(pdfUrl);
        return loadingTask.promise.then(async (pdfInstance: any) => {
          if (cancelled || myLoadId !== loadIdRef.current) return;
          setPdf(pdfInstance);
          setNumPages(pdfInstance.numPages);
          setCurrentPage(1);
          await calculateDimensions(pdfInstance);
        });
      })
      .catch((e: any) => {
        if (cancelled || myLoadId !== loadIdRef.current) return;
        console.error('PDF load failed', e);
        setError('Failed to load PDF.');
        setPdf(null);
        setNumPages(0);
        setCurrentPage(0);
      });
    return () => { cancelled = true; };
  }, [pdfUrl, calculateDimensions]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timers
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Clear canvas pool
      canvasPoolRef.current = [];
      memoryStatsRef.current = { activeCanvases: 0, poolSize: 0, renderCount: 0 };
    };
  }, []);

  // When dimensions update, try to call flipbook update and force refresh
  useEffect(() => {
    // short debounce to allow dimensions to settle
    const t = setTimeout(() => {
      try {
        if (flipbookRef.current) {
          // Try multiple update methods
          if (typeof flipbookRef.current.update === 'function') {
            flipbookRef.current.update();
          }
          if (typeof flipbookRef.current.updateFromHtml === 'function') {
            flipbookRef.current.updateFromHtml();
          }
          if (typeof flipbookRef.current.render === 'function') {
            flipbookRef.current.render();
          }
        }
      } catch (e) {
        console.warn('Flipbook update failed', e);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [dimensions.width, dimensions.height, dimensions.scale]); // Added scale dependency

  // Navigation handlers for flipbook
  const goToNext = useCallback(() => {
    try {
      const book = flipbookRef.current;
      if (!book) return;
      // Preferred: pageFlip() returns the PageFlip instance
      if (typeof book.pageFlip === 'function') {
        const pf = book.pageFlip();
        if (pf && typeof pf.flipNext === 'function') {
          pf.flipNext();
          return;
        }
      }
      // Fallbacks for other shapes
      if (book.pageFlip && typeof book.pageFlip.flipNext === 'function') {
        book.pageFlip.flipNext();
        return;
      }
      if (typeof book.flipNext === 'function') {
        book.flipNext();
        return;
      }
    } catch (e) {
      // best-effort
    }
  }, []);

  const goToPrev = useCallback(() => {
    try {
      const book = flipbookRef.current;
      if (!book) return;
      if (typeof book.pageFlip === 'function') {
        const pf = book.pageFlip();
        if (pf && typeof pf.flipPrev === 'function') {
          pf.flipPrev();
          return;
        }
      }
      if (book.pageFlip && typeof book.pageFlip.flipPrev === 'function') {
        book.pageFlip.flipPrev();
        return;
      }
      if (typeof book.flipPrev === 'function') {
        book.flipPrev();
        return;
      }
    } catch (e) {
      // best-effort
    }
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    try {
      if (!flipbookRef.current) return;
      // react-pageflip accepts page index (0-based) via flipbookRef.current.flip(pageIndex)
      const targetIndex = Math.max(0, Math.min((numPages - 1), pageNumber - 1));
      const book = flipbookRef.current;
      if (typeof book.pageFlip === 'function') {
        const pf = book.pageFlip();
        if (pf && typeof pf.flip === 'function') {
          pf.flip(targetIndex);
        } else if (pf && typeof pf.flip === 'undefined' && typeof pf.flipToPage === 'function') {
          pf.flipToPage(targetIndex);
        }
      } else if (book.pageFlip && typeof book.pageFlip.flip === 'function') {
        book.pageFlip.flip(targetIndex);
      } else if (typeof book.flip === 'function') {
        book.flip(targetIndex);
      }
      setCurrentPage(targetIndex + 1);
    } catch (e) {}
  }, [numPages]);

  // Responsive resize (debounced with setTimeout for better performance)
  useEffect(() => {
    if (!pdf) return;
    
    const scheduleCalc = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = window.setTimeout(() => {
        calculateDimensions(pdf);
      }, 100);
    };

    // Use ResizeObserver if available to detect container size changes
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          scheduleCalc();
        }
      });
      ro.observe(wrapperRef.current);
      
      return () => {
        if (wrapperRef.current) ro.unobserve(wrapperRef.current);
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      };
    } else {
      // fallback to window resize
      const handleResize = () => scheduleCalc();
      window.addEventListener('resize', handleResize);
      // initial schedule
      scheduleCalc();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      };
    }
  }, [pdf, calculateDimensions]);

  // Memoized file handling functions to prevent unnecessary re-renders
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [config.userId, data, onDataChange]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput) {
      setPdfUrl(urlInput);
      onDataChange({ url: urlInput });
    }
  }, [urlInput, onDataChange]);

  const renderPages = useCallback(() => {
    if (!pdf) return null;
    
    // Simple approach: render all pages but optimize Page component with lazy loading
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(
        <Page 
          key={i} 
          pageNumber={i} 
          pdf={pdf} 
          scale={dimensions.scale} 
          canvasPool={{ get: getCanvasFromPool, return: returnCanvasToPool }} 
        />
      );
    }
    
    return pages;
  }, [numPages, pdf, dimensions.scale, getCanvasFromPool, returnCanvasToPool]);

  // Use a single, shared flipbook configuration so readOnly and edit mode render the same
  const flipbookProps = useMemo(() => ({
    // size + dims vary by readOnly; keep other props shared
    width:  Math.round(dimensions.width / 2),
    height: Math.round(dimensions.height / 2),
    className: 'flip-book shadow-lg',
    showCover: false,
    mobileScrollSupport: true,
    size: ('fixed' as 'fixed'),
    minWidth: 315,
    maxWidth: 1400, // Increased from 1000
    minHeight: 400,
    maxHeight: 2000, // Increased from 1533
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
  }), [dimensions.width, dimensions.height, dimensions.scale]); // ✅ Added scale dependency

  // Force flipbook re-render when dimensions change significantly
  const flipbookKey = useMemo(() => {
    // Create a key that changes when dimensions change significantly
    const widthKey = Math.floor(dimensions.width / 100); // Changes every 100px
    const heightKey = Math.floor(dimensions.height / 100);
    return `flipbook-${widthKey}-${heightKey}-${Math.floor(dimensions.scale * 100)}`;
  }, [dimensions.width, dimensions.height, dimensions.scale]);

  // Single render path: controls (when no pdfUrl) and a single HTMLFlipBook instance

  // Sync current page from flipbook (fallback polling for various react-pageflip versions)
  useEffect(() => {
    if (!flipbookRef.current) return;
    let mounted = true;
    const poll = () => {
      try {
        let idx = null as number | null;
        const book = flipbookRef.current;
        if (!book) return;
        if (typeof book.pageFlip === 'function') {
          const pf = book.pageFlip();
          if (pf && typeof pf.getCurrentPageIndex === 'function') idx = pf.getCurrentPageIndex();
        }
        if (idx === null) {
          if (book.pageFlip && typeof book.pageFlip.getCurrentPageIndex === 'function') idx = book.pageFlip.getCurrentPageIndex();
          else if (typeof book.getCurrentPageIndex === 'function') idx = book.getCurrentPageIndex();
          else if (typeof book.getCurrentPage === 'function') idx = book.getCurrentPage();
        }
        if (mounted && idx !== null && !isNaN(idx)) {
          setCurrentPage(idx + 1);
        }
      } catch (e) {}
    };

    const id = window.setInterval(poll, 300);
    // initial poll
    poll();

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pdfUrl, numPages]);

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
        <div className="w-full h-full flex flex-col items-center justify-center" 
             style={{ 
               minHeight: `${Math.round(dimensions.height / 2) + 50}px`,
               transition: 'min-height 0.2s ease-out' 
             }}>
          {/* Navigation toolbar */}
          <div className="w-full max-w-4xl px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={goToPrev} aria-label="Previous page" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
              <button onClick={goToNext} aria-label="Next page" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Next</button>
              <div className="ml-3 text-sm text-gray-600">Page</div>
              <div className="ml-1">
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={currentPage}
                  readOnly
                  aria-readonly="true"
                  className="w-20 border border-gray-300 px-2 py-1 rounded text-sm bg-white"
                />
                <span className="ml-2 text-sm text-gray-500">of {numPages}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Open</a>
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {!error && pdf && numPages > 0 ? (
              <HTMLFlipBook ref={flipbookRef} key={flipbookKey} {...flipbookProps}>
                {renderPages()}
              </HTMLFlipBook>
          ) : !error && <p>Loading PDF...</p>}
        </div>
      )}
    </div>
  );
};

const Page = React.memo(React.forwardRef<HTMLDivElement, { 
  pageNumber: number; 
  pdf: PDFDocumentProxy; 
  scale: number;
  canvasPool?: { get: () => HTMLCanvasElement; return: (canvas: HTMLCanvasElement) => void }
}>(({ pageNumber, pdf, scale, canvasPool }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScaleRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only need to observe once
        }
      },
      {
        rootMargin: '200px', // Load pages 200px before they come into view
      }
    );

    if (pageRef.current) {
      observer.observe(pageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Optimized rendering with OffscreenCanvas when available
  const renderPageOptimized = useCallback(async (page: any, viewport: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use OffscreenCanvas when available for better performance
    const useOffscreen = typeof OffscreenCanvas !== 'undefined';
    
    if (useOffscreen) {
      try {
        const offscreen = new OffscreenCanvas(viewport.width, viewport.height);
        const offscreenContext = offscreen.getContext('2d');
        if (offscreenContext) {
          const renderTask = page.render({ canvasContext: offscreenContext, viewport });
          await renderTask.promise;
          
          // Transfer to main canvas
          const mainContext = canvas.getContext('2d');
          if (mainContext) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            mainContext.drawImage(offscreen as any, 0, 0);
          }
          return;
        }
      } catch (e) {
        // Fallback to regular canvas if OffscreenCanvas fails
      }
    }

    // Regular canvas rendering
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderTask = page.render({ canvasContext: context, viewport });
      await renderTask.promise;
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return; // Don't render until visible
    
    let cancelled = false;
    // Smart scale change detection - more sensitive on smaller scales
    const currentScale = lastScaleRef.current;
    if (currentScale !== null) {
      const scaleChangePercent = Math.abs(scale - currentScale) / currentScale;
      const threshold = scale < 0.5 ? 0.02 : scale < 1.0 ? 0.01 : 0.005; // More sensitive at small scales
      if (scaleChangePercent < threshold) {
        return; // Skip insignificant changes
      }
    }
    lastScaleRef.current = scale;
    
    if (pdf) {
      // Memory-efficient approach: reuse existing canvas when possible
      pdf.getPage(pageNumber).then(async (page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        
        // Check if we can reuse existing canvas dimensions
        const canvas = canvasRef.current;
        const needsResize = canvas && (
          Math.abs(canvas.width - viewport.width) > 10 ||
          Math.abs(canvas.height - viewport.height) > 10
        );
        
        if (!needsResize && canvas && canvas.width > 0) {
          // Canvas size is close enough, just clear and re-render
          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        
        try {
          await renderPageOptimized(page, viewport);
        } catch (e: any) {
          // Suppress expected cancellation noise
          if (e?.name !== 'RenderingCancelledException') {
            console.warn(`Page ${pageNumber} render error`, e);
          }
        }
      }).catch((e) => console.warn('Page render failed', e));
    }
    
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, isVisible, renderPageOptimized]);

  return (
    <div 
      ref={(node) => {
        pageRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }} 
      className="page"
      style={{ minHeight: '400px' }} // Ensure page has height for intersection observer
    >
      {isVisible ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="bg-gray-100 h-full flex items-center justify-center text-gray-500 min-h-[400px]">
          <div>Page {pageNumber}</div>
        </div>
      )}
    </div>
  );
}));

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
