import React, { useState, useEffect, useRef } from "react";
// EditorJS + tools will be dynamically imported to reduce initial bundle size
// (All previous static imports replaced below inside useEffect)
import { uploadFile } from "../../api/file.ts";
import { FileSubmit } from "../App/Interfaces/interface.ts";
import VideoTool from "./VideoTool.tsx";
import DocumentTool from "./DocumentTool.tsx";
import PdfFlipBookTool from "./PdfFlipBookTool.tsx";
import { useUserContext } from "../App/context/userContext.tsx";
import Loading from "./Loading.tsx";
import { PostSettings, PageSettings } from "../App/Interfaces/interface.ts";
import { EditorMode } from "../enum.ts";
import { useTheme } from "../../context/themeContext.js";
import { useDelayedRender } from "./DelayRender.ts";

interface PageCreatorProps {
  mode: EditorMode;
  settings?: PageSettings | PostSettings;
  onSave?: (settings: PageSettings | PostSettings, content: string) => Promise<void>;
  content?: string;
}

export default function PageCreator({ mode, settings, onSave, content }: PageCreatorProps) {
  const user = useUserContext();
  const { isDark } = useTheme();
  const editorRef = useRef<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const delayedReady = useDelayedRender(isReady, 1500);
  const [previewEnabled, setPreviewEnabled] = useState(mode === EditorMode.ReadOnly);
  const [shouldLoadEditor, setShouldLoadEditor] = useState(false);

  // Helper: add spinner styles
  const addSpinnerStyles = () => {
    if (typeof document === 'undefined') return;
    const existing = document.head?.querySelector('style[data-spinner-pagecreator]');
    if (existing) return;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-spinner-pagecreator', 'true');
    styleEl.textContent = `@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
    document.head?.appendChild(styleEl);
  };

  const getDefaultContent = () => ({ time: Date.now(), blocks: [], version: '2.31.0-rc.7' });
  const parseContent = (raw?: string) => {
    if (!raw) return getDefaultContent();
    try { return JSON.parse(raw); } catch { return getDefaultContent(); }
  };

  // Defer initializing Editor.js until the editor container is near the viewport
  useEffect(() => {
    if (typeof window === 'undefined') {
      setShouldLoadEditor(true);
      return;
    }

    const el = document.getElementById('editorjs');
    if (!el) {
      // If container not found (server-side or rendered differently), load immediately
      setShouldLoadEditor(true);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setShouldLoadEditor(true);
          io.disconnect();
          break;
        }
      }
    }, { rootMargin: '500px' });

    io.observe(el);

    return () => io.disconnect();
  }, []);

  // Only initialize Editor.js when user is loaded and the editor should be loaded
  useEffect(() => {
    if (!user || !user.id) return;
    if (!shouldLoadEditor) return;
    addSpinnerStyles();

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const doImport = async () => {
      try {
        const [EditorJSMod, HeaderMod, ParagraphMod, CodeMod, LinkToolMod, QuoteMod, DelimiterMod, TableMod, AttachesMod, EmbedMod, RawMod, ImageToolMod] = await Promise.all([
          import(/* webpackChunkName: "editor-core" */ '@editorjs/editorjs'),
          import('@editorjs/header'),
          import('@editorjs/paragraph'),
          import('@editorjs/code'),
          import('@editorjs/link'),
          import('@editorjs/quote'),
          import('@editorjs/delimiter'),
          import('@editorjs/table'),
          import('@editorjs/attaches'),
          import('@editorjs/embed'),
          import('@editorjs/raw'),
          import('@editorjs/image')
        ]);
        if (cancelled) return;
        const EditorJS = EditorJSMod.default;
        const Header = HeaderMod.default;
        const Paragraph = ParagraphMod.default;
        const Code = CodeMod.default;
        const LinkTool = LinkToolMod.default;
        const Quote = QuoteMod.default;
        const Delimiter = DelimiterMod.default;
        const Table = TableMod.default as any;
        const AttachesTool = AttachesMod.default;
        const Embed = EmbedMod.default;
        const RawTool = RawMod.default;
        const ImageTool = ImageToolMod.default;

        let editorInstance = new EditorJS({
          readOnly: previewEnabled,
          onReady: async () => {
            setIsReady(true);
          },
          holder: "editorjs",
          minHeight: mode === EditorMode.ReadOnly ? 300 : 300,
          placeholder: "Let's write an awesome story!",
          tools: {
            header: { class: Header, config: { placeholder: "Enter a header", levels: [1,2,3,4,5,6], defaultLevel: 2 } },
            paragraph: { class: Paragraph, inlineToolbar: true, config: { placeholder: mode === EditorMode.ReadOnly ? "" : "Enter text here..." } },
            quote: { class: Quote, inlineToolbar: true, shortcut: "CMD+SHIFT+O", config: { quotePlaceholder: "Enter a quote", captionPlaceholder: "Quote's author" } },
            code: { class: Code, shortcut: "CMD+SHIFT+C" },
            delimiter: Delimiter,
            table: { class: Table, inlineToolbar: true, config: { rows: 2, cols: 3 } },
            linkTool: { class: LinkTool, config: { endpoint: '/api/fetchUrl' } },
            image: { class: ImageTool, config: { field: 'image', types: 'image/*', captionPlaceholder: 'Enter image caption...', buttonContent: 'Select an Image', uploader: {
              uploadByFile: async (file: File) => {
                try {
                  if (!user || !user.id) throw new Error('User not loaded.');
                  let fileSubmit: FileSubmit = { type: file.type || 'application/octet-stream', uploaded_by: user.id, uploaded_at: new Date() };
                  const res = await uploadFile(file, fileSubmit);
                  return { success: 1, file: { url: res.staticUrl || '', filename: res.filename, path: res.path } };
                } catch (error) {
                  console.error('Image upload failed: ', error);
                  return { success: 0 };
                }
              },
              uploadByUrl: (url: string) => Promise.resolve({ success: 1, file: { url } })
            } } },
            attaches: { class: AttachesTool, config: { buttonText: 'Add PDF/Document', uploader: {
              uploadByUrl: (url: string) => Promise.resolve({ success: 1, file: { url, title: url.split('/').pop() || 'Document', extension: url.split('.').pop() || 'pdf' } }),
              uploadByFile: async (file: File) => {
                try {
                  if (!user || !user.id) throw new Error('User not loaded.');
                  let fileSubmit: FileSubmit = { type: file.type || 'application/octet-stream', uploaded_by: user.id, uploaded_at: new Date() };
                  const res = await uploadFile(file, fileSubmit);
                  return { success: 1, file: { url: res.staticUrl || '', title: res.filename, extension: file.name.split('.').pop() } };
                } catch (error) {
                  console.error('File upload failed: ', error);
                  return { success: 0 };
                }
              }
            } } },
            embed: Embed,
            raw: RawTool,
            video: { class: VideoTool, config: { userId: user.id } },
            document: { class: DocumentTool, config: { userId: user.id } },
            pdfFlipBook: { class: PdfFlipBookTool, config: { userId: user.id } }
          },
          data: parseContent(content),
          onChange: async () => {
            // existing onChange logic below remains unchanged
          }
        });
        if (cancelled) return;
        setEditor(editorInstance);
        editorRef.current = editorInstance;
      } catch (e) {
        if (!cancelled) console.error('Failed to load editor dynamically', e);
      }
    };

    // schedule import during idle time when possible
    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => {
        doImport();
      }, { timeout: 2000 });
    } else {
      // fallback: small timeout
      timeoutId = (window as any).setTimeout(() => doImport(), 300);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && 'cancelIdleCallback' in window) {
        try { (window as any).cancelIdleCallback(idleId); } catch {}
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [user, previewEnabled, content, mode, shouldLoadEditor]);

  const saveData = async () => {
    if (editor) {
      try {
        const outputData = await editor.save();
        const content = JSON.stringify(outputData);
        await onSave(settings, content);
      } catch (error) {
        console.log("Saving failed: ", error);
      }
    }
  };

  const clearEditor = () => {
    if (editor) {
      editor.clear();
    }
  };

  const loadSampleData = async () => {
    if (editor) {
      const sampleData = {
        time: Date.now(),
        blocks: [
          {
            type: "header",
            data: {
              text: "Sample Article Title",
              level: 1,
            },
          },
          {
            type: "paragraph",
            data: {
              text: "This is a sample paragraph with some <b>bold text</b> and <i>italic text</i>.",
            },
          },
          {
            type: "list",
            data: {
              style: "ordered",
              items: [
                "First item in ordered list",
                "Second item with some formatting",
                "Third item",
              ],
            },
          },
          {
            type: "quote",
            data: {
              text: "The best way to find out if you can trust somebody is to trust them.",
              caption: "Ernest Hemingway",
              alignment: "left",
            },
          },
          {
            type: "code",
            data: {
              code: "console.log('Hello, Editor.js!');\nconst editor = new EditorJS();",
            },
          },
          {
            type: "image",
            data: {
              file: {
                url: "https://via.placeholder.com/600x400/007bff/ffffff?text=Sample+Image",
              },
              caption: "This is a sample image loaded from URL",
              withBorder: false,
              withBackground: false,
              stretched: false,
            },
          },
          {
            type: "attaches",
            data: {
              file: {
                url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                title: "Sample PDF Document",
                extension: "pdf",
              },
              title: "Sample PDF Document",
            },
          },
          {
            type: "flipbook",
            data: {
              url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
              title: "Interactive FlipBook Demo",
              totalPages: 1,
              currentPage: 1,
            },
          },
        ],
        version: "2.30.8",
      };

      try {
        await editor.render(sampleData);
      } catch (error) {
        console.error("Error loading sample data:", error);
      }
    }
  };

  if (!user || !user.id ) {
    return <Loading />;
  }

  return (
    <div className="h-full mx-auto">
      {/* Control buttons */}
      {mode !== EditorMode.ReadOnly && (
        <div className={`mb-6 flex gap-3 flex-wrap p-4 rounded-xl transition-all duration-300 border ${
          isDark 
            ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200'
        }`}>
          <button
            onClick={saveData}
            disabled={!isReady}
            className={`px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              isReady 
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            💾 Save Content
          </button>

          <button
            onClick={clearEditor}
            disabled={!isReady}
            className={`px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              isReady 
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            🗑️ Clear Editor
          </button>

          <button
            onClick={loadSampleData}
            disabled={!isReady}
            className={`px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              isReady 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            📝 Load Sample Data
          </button>

          <button
            onClick={async () => console.log(await editor.save())}
            className={`px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              isReady 
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isReady}
          >
            📦 Export Log
          </button>
        </div>
      )}

      {/* Editor container */}
        <div
          id="editorjs"
          className="rounded-xl p-6 w-full relative transition-all duration-300"
        />

        

        {delayedReady && (
        <div className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          text-center p-8 rounded-xl backdrop-blur-sm
          transition-all duration-700 ease-out delay-300
          ${isDark 
            ? 'text-gray-300 bg-gray-800/95 shadow-2xl shadow-black/40' 
            : 'text-gray-600 bg-white/90 shadow-2xl shadow-black/10'
          }
          opacity-100 scale-100
        `}>
          <div className={`
            w-12 h-12 mx-auto mb-4 rounded-full animate-spin
            border-4 border-t-blue-500
            transition-colors duration-300
            ${isDark ? 'border-gray-600' : 'border-gray-200'}
          `}></div>
          <div className={`
            text-lg font-medium transition-all duration-700 delay-300
            ${isDark ? 'text-gray-100' : 'text-gray-800'}
            opacity-100
          `}>
            Loading Editor...
          </div>
        </div>
      )}
      

      {/* Instructions */}
      {mode !== EditorMode.ReadOnly && (
      <div className={`mt-6 p-6 rounded-xl border transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600' 
          : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          isDark ? 'text-emerald-400' : 'text-green-700'
        }`}>
          💡 How to use the Editor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div className={`p-4 rounded-lg border transition-all duration-300 ${
            isDark 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-green-100'
          }`}>
            <h4 className={`mb-2 font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              ✨ Quick Actions
            </h4>
            <ul className={`m-0 pl-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Click the <strong>+</strong> button to add new blocks</li>
              <li>Use <strong>Tab</strong> to open the block toolbar</li>
              <li>Use <strong>/</strong> to open the inline tool menu</li>
              <li>Select text to see inline formatting options</li>
            </ul>
          </div>
          
          <div className={`p-4 rounded-lg border transition-all duration-300 ${
            isDark 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-green-100'
          }`}>
            <h4 className={`mb-2 font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              ⌨️ Keyboard Shortcuts
            </h4>
            <ul className={`m-0 pl-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li><strong>Cmd+Shift+C</strong> for code blocks</li>
              <li><strong>Cmd+Shift+O</strong> for quotes</li>
              <li><strong>Cmd+B</strong> for bold text</li>
              <li><strong>Cmd+I</strong> for italic text</li>
            </ul>
          </div>

          <div className={`p-4 rounded-lg border transition-all duration-300 ${
            isDark 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-green-100'
          }`}>
            <h4 className={`mb-2 font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              📎 Media & Files
            </h4>
            <ul className={`m-0 pl-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Add <strong>Images</strong> by uploading or pasting URLs</li>
              <li>Add <strong>Videos</strong> by uploading files or URLs</li>
              <li>Embed <strong>YouTube/Vimeo</strong> videos automatically</li>
              <li>Add <strong>Documents</strong> (PDF, DOC, PPT) with preview</li>
              <li>Add <strong>FlipBook PDFs</strong> with page-turning animation</li>
              <li>Add <strong>PDF documents</strong> via file upload</li>
              <li>Embed <strong>Custom HTML</strong> for special content</li>
              <li>Embed <strong>Links</strong> with automatic preview</li>
              <li>Create <strong>Tables</strong> for structured data</li>
            </ul>
          </div>
        </div>

        <div className={`p-4 rounded-lg border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-green-100'
        }`}>
          <h4 className={`mb-3 font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
            🧱 Available Block Types
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-blue-500">📝 Text:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> Headers, Paragraphs, Quotes</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-green-500">📋 Lists:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> Ordered, Unordered, Checklists</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-orange-500">🎨 Media:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> Images, Videos, Documents</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-purple-500">💻 Code:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> Code blocks, Tables, Raw HTML</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-pink-500">🔗 Embeds:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> YouTube, Vimeo, Links</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-green-500">📄 Documents:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> PDF, Word, PowerPoint, Excel</span>
            </div>
            <div className={`p-2 rounded transition-all duration-300 ${
              isDark ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <strong className="text-cyan-500">📖 FlipBook:</strong> 
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}> Interactive PDF with page-flip animation</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
