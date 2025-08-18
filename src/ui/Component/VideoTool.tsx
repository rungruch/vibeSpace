import React, { useState, useRef, useEffect } from 'react';
import { uploadFile } from '../../api/file.ts';
import { FileSubmit } from '../interface.ts';
import { createRoot } from 'react-dom/client';

/**
 * Custom Video Tool for EditorJS with React TypeScript and Tailwind CSS
 * Handles video uploads and custom video URLs from backend
 */

interface VideoData {
  url: string;
  caption: string;
  filename?: string;
  poster?: string;
  withBorder?: boolean;
  stretched?: boolean;
  withBackground?: boolean;
}

interface VideoConfig { userId?: string; }

interface VideoToolProps {
  data: VideoData;
  config: VideoConfig;
  readOnly: boolean;
  onDataChange: (data: VideoData) => void;
}

const VideoComponent: React.FC<VideoToolProps> = ({ data, config, readOnly, onDataChange }) => {
  const [videoData, setVideoData] = useState<VideoData>(data);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateData = (newData: Partial<VideoData>) => {
    const updatedData = { ...videoData, ...newData };
    setVideoData(updatedData);
    onDataChange(updatedData);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const submit: FileSubmit = { type: file.type || 'application/octet-stream', uploaded_by: config.userId || 'anonymous', uploaded_at: new Date() };
      const res = await uploadFile(file, submit);
      updateData({ url: res.staticUrl || res.url || '', filename: res.filename || file.name });
    } catch (e) {
      console.error('Video upload failed:', e);
      setUploadError('Upload failed. Please try again.');
    } finally { setIsUploading(false); }
  };

  const handleUrlSubmit = (url: string) => {
    if (url.trim()) {
      updateData({ url: url.trim() });
    }
  };

  const toggleTune = (tuneName: keyof VideoData) => {
    updateData({ [tuneName]: !videoData[tuneName] });
  };

  if (videoData.url) {
    return (
      <div className="w-full">
        <div className={`relative ${videoData.stretched ? 'w-full' : 'max-w-4xl mx-auto'}`}>
          <video
            src={videoData.url}
            poster={videoData.poster}
            controls
            preload="metadata"
            className={`
              w-full rounded-lg shadow-lg transition-all duration-200
              ${videoData.withBorder ? 'border-2 border-gray-200 dark:border-gray-600' : ''}
              ${videoData.withBackground ? 'bg-gray-50 dark:bg-gray-800 p-4' : ''}
            `}
          />
        </div>
        
        {!readOnly && (
          <div className="mt-4 space-y-3">
            {/* Caption */}
            <input
              type="text"
              value={videoData.caption}
              onChange={(e) => updateData({ caption: e.target.value })}
              placeholder="Enter video caption..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Tune Options */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleTune('withBorder')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${videoData.withBorder 
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-blue-50 dark:hover:bg-blue-800`}
              >
                🖼️ With Border
              </button>
              
              <button
                onClick={() => toggleTune('stretched')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${videoData.stretched 
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-green-50 dark:hover:bg-green-800`}
              >
                ↔️ Stretch
              </button>
              
              <button
                onClick={() => toggleTune('withBackground')}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${videoData.withBackground 
                    ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }
                  hover:bg-purple-50 dark:hover:bg-purple-800`}
              >
                🎨 Background
              </button>
            </div>
          </div>
        )}
        
        {videoData.caption && (
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {videoData.caption}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No video to display</p>
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
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                   text-white rounded-lg hover:from-blue-600 hover:to-blue-700 
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
              Upload Video
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
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
            placeholder="Paste video URL here..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target && target.value) {
                  handleUrlSubmit(target.value);
                  target.value = ''; // Clear input after submission
                }
              }
            }}
            onPaste={(e) => {
              setTimeout(() => {
                const target = e.target as HTMLInputElement;
                if (target && target.value) {
                  handleUrlSubmit(target.value);
                  target.value = ''; // Clear input after submission
                }
              }, 100);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Supported Formats */}
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Supports: MP4, WebM, MOV, AVI
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

export default class VideoTool {
  private api: any;
  private readOnly: boolean;
  private config: VideoConfig;
  private data: VideoData;
  private wrapper: HTMLElement | undefined;
  private reactRoot: any;

  static get toolbox() {
    return {
      title: 'Video',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8 14V6l6 4-6 4z" fill="currentColor"/></svg>'
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
      caption: data.caption || '',
      filename: data.filename || '',
      poster: data.poster || '',
      withBorder: data.withBorder || false,
      stretched: data.stretched || false,
      withBackground: data.withBackground || false,
      ...data
    };

    this.wrapper = undefined;
    this.reactRoot = undefined;
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('video-tool-wrapper');
    
    this.reactRoot = createRoot(this.wrapper);
    this.renderReactComponent();
    
    return this.wrapper;
  }

  renderReactComponent() {
    if (this.reactRoot) {
      this.reactRoot.render(
        React.createElement(VideoComponent, {
          data: this.data,
          config: this.config,
          readOnly: this.readOnly,
          onDataChange: (newData: VideoData) => {
            this.data = newData;
          }
        })
      );
    }
  }

  save() {
    return this.data;
  }

  validate(savedData: VideoData) {
    return savedData.url ? true : false;
  }

  destroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
  }
}
