import React, { useRef, useState } from 'react';
import { uploadFile } from '../../api/file.ts';
import { useUserContext } from '../App/context/userContext.tsx';
import { FileSubmit } from '../App/Interfaces/interface.ts';
import { useTheme } from '../../context/themeContext.js';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const user = useUserContext();
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : '');
    setMessage('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage('กรุณาเลือกไฟล์');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      let fileSubmit: FileSubmit = {
        type: file.type || 'application/octet-stream',
        uploaded_by: user.id,
        uploaded_at: new Date()
      };
      let uploadResp = await uploadFile(file, fileSubmit);
      console.log(uploadResp);
      setMessage('อัปโหลดไฟล์สำเร็จ!');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setMessage('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto mt-10 p-6 rounded-xl shadow-lg border transition-colors ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h2 className={`mb-4 text-2xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="mr-2 text-xl">📄</span>อัปโหลดไฟล์
      </h2>
  <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <label htmlFor="file-upload" className={`font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>เลือกไฟล์เอกสารหรือรูปภาพ</label>
        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={`p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
        />
        {fileName && <div className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>ไฟล์ที่เลือก: <b>{fileName}</b></div>}
        <button
          type="submit"
          disabled={uploading}
          className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 shadow ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'} ${isDark ? '' : ''}`}
        >
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        </button>
      </form>
      <div className={`mt-4 text-base min-h-[24px] ${message.includes('สำเร็จ') ? 'text-green-500' : 'text-red-500'}`}>{message}</div>
      <div className={`mt-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        รองรับไฟล์เอกสารและรูปภาพทุกประเภท
      </div>
    </div>
  );
};

export default FileUpload;
