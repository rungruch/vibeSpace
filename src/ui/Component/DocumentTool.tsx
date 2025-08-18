import React, { useState, useRef, useEffect } from 'react';
import { uploadFile } from '../../api/file.ts';
import { FileSubmit } from '../App/Interfaces/interface.ts';
let DocViewerMod: any = null;
async function ensureDocViewer() {
  if (DocViewerMod) return DocViewerMod;
  const mod = await import(/* webpackChunkName: "doc-viewer" */ '@cyntler/react-doc-viewer');
  await import(/* webpackChunkName: "doc-viewer-css" */ '@cyntler/react-doc-viewer/dist/index.css');
  DocViewerMod = mod;
  return DocViewerMod;
}

// import * as pdfjsLib from "pdfjs-dist/build/pdf";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { createRoot } from 'react-dom/client';

/**
 * Custom Document Tool for EditorJS with React TypeScript and Tailwind CSS
 * Handles PDF, PPT, DOC previews with multiple viewing options
 */

interface DocumentData {
  url: string;
  title: string;
  filename?: string;
  fileType?: string;
  fileSize?: string;
  previewMode?: 'embed' | 'link' | 'thumbnail';
  withBorder?: boolean;
  stretched?: boolean;
}

interface DocumentConfig { userId?: string; }

interface DocumentToolProps {
  data: DocumentData;
  config: DocumentConfig;
  readOnly: boolean;
  onDataChange: (data: DocumentData) => void;
}

const DocumentComponent: React.FC<DocumentToolProps> = ({ data, config, readOnly, onDataChange }) => {
  const [docData, setDocData] = useState<DocumentData>(data);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Viewer state (must be declared at top level to satisfy Hooks rules)
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerMod, setViewerMod] = useState<any>(DocViewerMod);

  const updateData = (newData: Partial<DocumentData>) => {
    const updatedData = { ...docData, ...newData };
    setDocData(updatedData);
    onDataChange(updatedData);
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc': return 'doc';
      case 'docx': return 'docx';
      case 'ppt': return 'ppt';
      case 'pptx': return 'pptx';
      case 'xls': return 'xls';
      case 'xlsx': return 'xlsx';
      default: return extension || 'document';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // All file types are rendered using DocViewer now.

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const submit: FileSubmit = { type: file.type || 'application/octet-stream', uploaded_by: config.userId || 'anonymous', uploaded_at: new Date() };
      const res = await uploadFile(file, submit);
      updateData({
        url: res.staticUrl || res.url || '',
        filename: res.filename || file.name,
        title: res.filename || file.name,
        fileType: getFileType(file.name),
        fileSize: formatFileSize(res.size || file.size),
        previewMode: 'embed'
      });
    } catch (e) {
      console.error('Document upload failed:', e);
      setUploadError('Upload failed. Please try again.');
    } finally { setIsUploading(false); }
  };

  const handleUrlSubmit = (url: string) => {
    if (url.trim()) {
      const filename = url.split('/').pop() || 'document';
      updateData({
        url: url.trim(),
        title: filename,
        filename: filename,
        fileType: getFileType(filename),
        previewMode: 'embed'
      });
    }
  };

  const toggleTune = (tuneName: keyof DocumentData) => {
    updateData({ [tuneName]: !docData[tuneName] });
  };

  // Load doc viewer lazily when needed
  useEffect(() => {
    let cancelled = false;
    if (docData.url && docData.previewMode !== 'link') {
      if (!viewerMod) {
        ensureDocViewer().then(m => {
          if (cancelled) return; setViewerMod(m); setViewerReady(true);
        });
      } else if (!viewerReady) {
        setViewerReady(true);
      }
    } else {
      // Not needed in link mode
      setViewerReady(false);
    }
    return () => { cancelled = true; };
  }, [docData.url, docData.previewMode, viewerMod, viewerReady]);

  const renderDocumentPreview = () => {
    if (!docData.url) return null;

    if (docData.previewMode === 'link') {
      return (
        <div className={`
          border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center
          hover:border-blue-400 dark:hover:border-blue-500 transition-colors
          ${docData.withBorder ? 'border-solid border-gray-400 dark:border-gray-500' : ''}
          ${docData.stretched ? 'w-full' : 'max-w-md mx-auto'}
        `}>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{docData.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {docData.fileType} {docData.fileSize && `• ${docData.fileSize}`}
          </p>
          <a
            href={docData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
            </svg>
            Open Document
          </a>
        </div>
      );
    }

    return (
      <div
        className="relative w-full"
        style={{
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!viewerReady && <div className="p-4 text-sm text-gray-500">Loading document viewer...</div>}
        {viewerReady && viewerMod && (
          <div
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              borderRadius: docData.withBorder ? 12 : 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: docData.withBorder ? '2px solid #e5e7eb' : 'none',
              background: 'white',
              margin: 0,
              position: 'relative',
            }}
          >
            {React.createElement(viewerMod.default, {
              documents: [{ uri: docData.url, fileType: docData.fileType }],
              pluginRenderers: viewerMod.DocViewerRenderers,
              config: { header: { disableHeader: true, disableFileName: false, retainURLParams: false } },
              style: {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                background: 'white',
                borderRadius: docData.withBorder ? 12 : 12,
                border: 'none',
              },
            })}
          </div>
        )}
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {docData.title} • {docData.fileType}
            {docData.fileSize && ` • ${docData.fileSize}`}
          </p>
        </div>
      </div>
    );
  };

  if (docData.url) {
    return (
      <div className="w-full">
        {renderDocumentPreview()}
        
        {!readOnly && (
          <div className="mt-4 space-y-3">
            {/* Title */}
            <input
              type="text"
              value={docData.title}
              onChange={(e) => updateData({ title: e.target.value })}
              placeholder="Enter document title..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Preview Mode */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateData({ previewMode: 'embed' })}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${docData.previewMode === 'embed'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-blue-50 dark:hover:bg-blue-800`}
              >
                📄 Embed Preview
              </button>
              
              <button
                onClick={() => updateData({ previewMode: 'link' })}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${docData.previewMode === 'link'
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-green-50 dark:hover:bg-green-800`}
              >
                🔗 Download Link
              </button>
            </div>
            
            {/* Style Options */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleTune('withBorder')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${docData.withBorder 
                    ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-purple-50 dark:hover:bg-purple-800`}
              >
                🖼️ With Border
              </button>
              
              <button
                onClick={() => toggleTune('stretched')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${docData.stretched 
                    ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-orange-50 dark:hover:bg-orange-800`}
              >
                ↔️ Stretch
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No document to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 
                   text-white rounded-lg hover:from-purple-600 hover:to-purple-700 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                   shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Upload Document
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="hidden"
        />

        <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
          or
        </div>

        {/* URL Input */}
        <div className="mt-4 max-w-md mx-auto">
          <input
            type="url"
            placeholder="Paste document URL here..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target && target.value) {
                  handleUrlSubmit(target.value);
                  target.value = '';
                }
              }
            }}
            onPaste={(e) => {
              setTimeout(() => {
                const target = e.target as HTMLInputElement;
                if (target && target.value) {
                  handleUrlSubmit(target.value);
                  target.value = '';
                }
              }, 100);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Supported Formats */}
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Supports: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default class DocumentTool {
  private api: any;
  private readOnly: boolean;
  private config: DocumentConfig;
  private data: DocumentData;
  private wrapper: HTMLElement | undefined;
  private reactRoot: any;

  static get toolbox() {
    return {
      title: 'Document',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 2.5H4.5c-.83 0-1.5.67-1.5 1.5v12c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5V4c0-.83-.67-1.5-1.5-1.5zM13 14H7v-1h6v1zm0-2H7v-1h6v1zm0-2H7V9h6v1zm0-2H7V7h6v1z" fill="currentColor"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, config, api, readOnly }: any) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};
    
    this.data = {
      url: data.url || '',
      title: data.title || '',
      filename: data.filename || '',
      fileType: data.fileType || '',
      fileSize: data.fileSize || '',
      previewMode: data.previewMode || 'embed',
      withBorder: data.withBorder || false,
      stretched: data.stretched || false,
      ...data
    };

    this.wrapper = undefined;
    this.reactRoot = undefined;
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('document-tool-wrapper');
    
    this.reactRoot = createRoot(this.wrapper);
    this.renderReactComponent();
    
    return this.wrapper;
  }

  renderReactComponent() {
    if (this.reactRoot) {
      this.reactRoot.render(
        React.createElement(DocumentComponent, {
          data: this.data,
          config: this.config,
          readOnly: this.readOnly,
          onDataChange: (newData: DocumentData) => {
            this.data = newData;
          }
        })
      );
    }
  }

  save() {
    return this.data;
  }

  validate(savedData: DocumentData) {
    return savedData.url ? true : false;
  }

  destroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
  }
}
