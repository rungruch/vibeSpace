import React, { useEffect, useState } from 'react';
import { getFiles, deleteFile } from "../../../../../api/file.ts";
import FileUpload from '../../../../Component/FileUpload.tsx';
import { useTheme } from '../../../../../context/themeContext.js';
import PaginatedList from '../../../../Component/PaginatedList.tsx';
import { EyeOutlined, LinkOutlined, DeleteOutlined} from '@ant-design/icons';
import { message, Modal } from 'antd';

const FileExplorerPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  // Fetch files from API
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await getFiles();
      console.log(response);
      setFiles(response.files);
    } catch (err) {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter files by search
  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(search.toLowerCase())
  );

  // Refresh file list after upload
  const handleUploadSuccess = () => {
    fetchFiles();
  };

  // Delete file handler
  const handleDeleteFile = (file) => {
    Modal.confirm({
      title: 'ยืนยันการลบไฟล์',
      content: `คุณต้องการลบไฟล์ ${file.filename} ใช่หรือไม่?`,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await deleteFile({ id: file.id, path: file.path });
          fetchFiles(); // refresh list
        } catch (err) {
          Modal.error({ title: 'เกิดข้อผิดพลาด', content: 'ลบไฟล์ไม่สำเร็จ' });
        }
      },
    });
  };

  return (
    <div className={`mx-auto mt-10 p-6 rounded-xl shadow-lg border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>ไฟล์</h2>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          onClick={() => setShowUpload(v => !v)}
        >
          {showUpload ? 'ปิดอัปโหลดไฟล์' : 'แสดงอัปโหลดไฟล์'}
        </button>
      </div>
      {showUpload && (
        <div className="mb-8">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}
      <div className="mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาไฟล์..." className={`w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:ring-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-400'}`} />
      </div>
      <PaginatedList
        items={filteredFiles}
        isLoading={loading}
        emptyTitle="ไม่มีไฟล์ที่อัปโหลด"
        emptyDescription="อัปโหลดไฟล์เพื่อแสดงที่นี่"
        pageSize={10}
        rowKey={file => file.id}
        renderDesktopHeader={
          <tr>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Preview</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Filename</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Type</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Uploaded</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Preview</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Download</th>
            <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Delete</th>
          </tr>
        }
        renderDesktopRow={file => (
          <tr>
            <td className="px-4 py-2">
              {file.type && file.type.startsWith('image/') ? (
                <img src={file.previewUrl} alt={file.filename} className={`w-16 h-16 object-cover rounded-md border ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
              ) : file.type === 'application/pdf' ? (
                <span className={`w-16 h-16 flex items-center justify-center rounded-md font-bold text-xl ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'}`}>PDF</span>
              ) : (
                <span className={`w-16 h-16 flex items-center justify-center rounded-md font-bold text-xl ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>FILE</span>
              )}
            </td>
            <td className={`px-4 py-2 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{file.filename}</td>
            <td className={`px-4 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{file.type}</td>
            <td className={`px-4 py-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(file.uploaded_at).toLocaleString()}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  className={`p-2 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                  title="แชร์ลิงก์"
                  onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(file.staticUrl);
                      message.success("คัดลอกลิงก์โพสต์แล้ว");
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = file.staticUrl;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      message.success("คัดลอกลิงก์โพสต์แล้ว");
                    }
                  }}
                >
                  <LinkOutlined />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                  title="ดูโพสต์"
                  onClick={() => window.open(file.staticUrl, '_blank')}
                >
                  <EyeOutlined />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                  title="ลบ"
                  onClick={() => handleDeleteFile(file)}
                >
                  <DeleteOutlined />
                </button>
              </div>
            </td>
            <td className="px-4 py-2">
              <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className={`px-3 py-1 rounded text-xs font-semibold transition ${isDark ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Download</a>
            </td>
            <td className="px-4 py-2">
              <button
                onClick={() => handleDeleteFile(file)}
                className={`p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 transition`}
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'text-red-300' : 'text-red-600'}`}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg>
              </button>
            </td>
          </tr>
        )}
        renderMobileCard={file => (
          <div className="flex items-center gap-4">
            {file.type && file.type.startsWith('image/') ? (
              <img src={file.previewUrl} alt={file.filename} className={`w-16 h-16 object-cover rounded-md border ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
            ) : file.type === 'application/pdf' ? (
              <span className={`w-16 h-16 flex items-center justify-center rounded-md font-bold text-xl ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'}`}>PDF</span>
            ) : (
              <span className={`w-16 h-16 flex items-center justify-center rounded-md font-bold text-xl ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>FILE</span>
            )}
            <div className="flex-1">
              <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{file.filename}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{file.type}</div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Uploaded: {new Date(file.uploaded_at).toLocaleString()}</div>
            </div>
            <button
              onClick={() => window.open(file.staticUrl, '_blank')}
              className={`p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition`}
              title="Preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}> <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /> </svg>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(file.staticUrl);
              }}
              className={`p-2 rounded hover:bg-green-100 dark:hover:bg-green-900 transition`}
              title="Copy link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v6A2.25 2.25 0 007.5 13.5H11" /> <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75V19.5A2.25 2.25 0 0010.5 21.75h6A2.25 2.25 0 0018.75 19.5v-6A2.25 2.25 0 0016.5 11.25H13.5" /> </svg>
            </button>
            <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className={`px-3 py-1 rounded text-xs font-semibold transition ${isDark ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Download</a>
            <button
              onClick={() => handleDeleteFile(file)}
              className={`p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 transition`}
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'text-red-300' : 'text-red-600'}`}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg>
            </button>
          </div>
        )}
      />
    </div>
  );
};

export default FileExplorerPage;