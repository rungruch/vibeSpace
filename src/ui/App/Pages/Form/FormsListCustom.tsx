import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CopyOutlined,
  SearchOutlined,
  BarChartOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../../context/themeContext';
import { fetchAllForms, deleteForm } from '../../../../api/forms';
import { useUserContext } from '../../context/userContext.tsx';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import PaginatedList from '../../../Component/PaginatedList.tsx';

/*
TODOS: get response data and buttons (Duplicate options, form editor permissions) 
*/

// Types for API response
// interface ApiForm {
//   SurveyID: string;
//   type: string;
//   title: string;
//   description: string;
//   is_retryable: boolean;
//   is_active: boolean;
//   visibility: string;
//   content: string;
//   created_by: string;
//   updated_by: string;
//   created_at: string;
//   updated_at: string;
//   slug: string;
//   is_batch_question: boolean;
//   batch_question_size: number;
//   passing_score: number;
// }

// form interface for component use
interface TransformedForm {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  responses: number;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  slug: string;
}


const FormsListCustom: React.FC = () => {
  const { isDark } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [userForms, setUserForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;
  const user = useUserContext();
  const navigate = useNavigate();

  // Fetch user forms data from APIs
  useEffect(() => {
    async function fetchUserForms() {
      try {
        setIsLoading(true);
        const forms = await fetchAllForms(user.id);
        setUserForms(forms);
      } catch (error) {
        console.error('Error fetching forms:', error);
        setUserForms([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.id) {
      fetchUserForms();
    }
  }, [user]);

  // Transform API data to component format
  const transformedForms: TransformedForm[] = userForms.map(form => ({
    id: form.SurveyID,
    title: form.title,
    description: form.description || 'ไม่มีคำอธิบาย',
    type: form.type.charAt(0).toUpperCase() + form.type.slice(1), // Capitalize first letter
    status: form.is_active ? 'Active' : 'Draft', // Convert boolean to status string
    responses: form.UserResponseCount,
    createdAt: form.created_at,
    updatedAt: form.updated_at,
    visibility: form.visibility,
    slug: form.slug
  }));

  // Filter forms based on search and filters
  const filteredForms = transformedForms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'All' || form.status === filterStatus;
    const matchesType = filterType === 'All' || form.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active': 
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'Draft': 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-zinc-600 dark:text-zinc-200';
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Quiz': 
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'Form': 
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-zinc-600 dark:text-zinc-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return 'เปิดใช้งาน';
      case 'Draft': return 'ร่าง';
      default: return status;
    }
  };

  async function handleDeleteForm(id: string): Promise<void> {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบฟอร์มนี้?',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
      try {
        setIsLoading(true);
        await deleteForm(id);
        setUserForms(prev => prev.filter(form => form.SurveyID !== id));
        message.success('ลบฟอร์มสำเร็จ');
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการลบฟอร์ม');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
      }
    });
  }
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Kanit, sans-serif' }}>
            จัดการฟอร์ม
          </h2>
          <p className="text-gray-500 text-lg" style={{ fontFamily: 'Kanit, sans-serif' }}>
            รายการฟอร์มและแบบสำรวจทั้งหมด
          </p>
        </div>
        <Link 
          to="/form/create"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-medium rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40 backdrop-blur-xl border border-blue-400/20 hover:border-blue-300/30 transform hover:scale-105 active:scale-95"
          style={{ 
            fontFamily: 'Kanit, sans-serif',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 1))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          <PlusOutlined />
          <span className="ml-2">สร้างฟอร์มใหม่</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {transformedForms.length}
          </div>
          <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
            ฟอร์มทั้งหมด
          </div>
        </div>
        <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {transformedForms.filter(f => f.status === 'Active').length}
          </div>
          <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
            ฟอร์มที่เปิดใช้งาน
          </div>
        </div>
        <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {transformedForms.reduce((sum, form) => sum + form.responses, 0).toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
            การตอบกลับทั้งหมด
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-4 mb-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="ค้นหาฟอร์ม..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark 
                  ? 'bg-zinc-600 border-zinc-500 text-white placeholder-zinc-300' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchOutlined />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark 
                ? 'bg-zinc-600 border-zinc-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="All">สถานะทั้งหมด</option>
            <option value="Active">เปิดใช้งาน</option>
            <option value="Draft">ร่าง</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark 
                ? 'bg-zinc-600 border-zinc-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="All">ประเภททั้งหมด</option>
            <option value="Form">Form</option>
            <option value="Quiz">Quiz</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <PaginatedList
        items={filteredForms}
        isLoading={isLoading}
        pageSize={itemsPerPage}
        emptyTitle="ไม่พบฟอร์ม"
        emptyDescription="คุณยังไม่มีฟอร์มใดๆ เริ่มต้นสร้างฟอร์มแรกของคุณ"
        rowKey={(form) => form.id}
        renderDesktopHeader={
          <tr>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              ชื่อฟอร์ม
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              ประเภท
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              สถานะ
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              การตอบกลับ
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              วันที่สร้าง
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>
              การดำเนินการ
            </th>
          </tr>
        }
        renderDesktopRow={(form) => (
          <tr key={form.id} className={isDark ? 'hover:bg-zinc-600' : 'hover:bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>
                  {form.title}
                </div>
                <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>
                  {form.description}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeStyle(form.type)}`}>
                {form.type}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(form.status)}`}>
                {getStatusText(form.status)}
              </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>
              {form.responses.toLocaleString()}
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>
              {new Date(form.createdAt).toLocaleDateString('th-TH')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  className={`p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                  title="แชร์ลิงก์"
                  onClick={async () => {
                    const url = form.slug 
                      ? `${window.location.origin}${process.env.DEV_MODE === 'production' ? process.env.BASE_NAME || '' : ''}/form?slug=${form.slug}`
                      : `${window.location.origin}${process.env.DEV_MODE === 'production' ? process.env.BASE_NAME || '' : ''}/form?id=${form.id}`;
                    
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(url);
                        message.success('คัดลอกลิงก์ฟอร์มแล้ว');
                      } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = url;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        message.success('คัดลอกลิงก์ฟอร์มแล้ว');
                      }
                    } catch (error) {
                      console.error('Failed to copy to clipboard:', error);
                      message.error('ไม่สามารถคัดลอกลิงก์ได้');
                    }
                  }}
                >
                  <LinkOutlined  />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                  title="ดูฟอร์ม"
                  onClick={() => navigate(`/form?id=${form.id}`)}
                >
                  <EyeOutlined />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                  onClick={() => navigate(`/form/edit/${form.id}`)}
                >
                  <EditOutlined />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                  title="รายงานการตอบกลับ"
                  onClick={() => navigate(`/form/responses/${form.id}`)}
                >
                  <BarChartOutlined />
                </button>
                <button
                  className={`hidden p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                  title="ทำซ้ำ"
                >
                  <CopyOutlined />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                  title="ลบ"
                  onClick={() => handleDeleteForm(form.id)}
                >
                  <DeleteOutlined />
                </button>
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(form) => (
          <>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>
                  {form.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-500'} mt-1`}>
                  {form.description}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeStyle(form.type)}`}>
                {form.type}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(form.status)}`}>
                {getStatusText(form.status)}
              </span>
            </div>
            
            <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-600'} mb-3`}>
              <div>การตอบกลับ: {form.responses.toLocaleString()}</div>
              <div>วันที่สร้าง: {new Date(form.createdAt).toLocaleDateString('th-TH')}</div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                title="แชร์ลิงก์"
                onClick={async () => {
                  const url = form.slug 
                    ? `${window.location.origin}${process.env.DEV_MODE === 'production' ? process.env.BASE_NAME || '' : ''}/form?slug=${form.slug}`
                    : `${window.location.origin}${process.env.DEV_MODE === 'production' ? process.env.BASE_NAME || '' : ''}/form?id=${form.id}`;
                  
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(url);
                      message.success('คัดลอกลิงก์ฟอร์มแล้ว');
                    } else {
                      const textArea = document.createElement('textarea');
                      textArea.value = url;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      message.success('คัดลอกลิงก์ฟอร์มแล้ว');
                    }
                  } catch (error) {
                    console.error('Failed to copy to clipboard:', error);
                    message.error('ไม่สามารถคัดลอกลิงก์ได้');
                  }
                }}
              >
                <LinkOutlined  />
              </button>
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                title="ดูฟอร์ม"
                onClick={() => navigate(`/form?id=${form.id}`)}
              >
                <EyeOutlined />
              </button>
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                title="แก้ไข"
                onClick={() => navigate(`/form/edit/${form.id}`)}
              >
                <EditOutlined />
              </button>
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                title="รายงานการตอบกลับ"
                onClick={() => navigate(`/form/responses/${form.id}`)}
              >
                <BarChartOutlined />
              </button>
              <button
                className={`hidden p-2 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-500 text-zinc-200' : 'text-gray-500'}`}
                title="ทำซ้ำ"
              >
                <CopyOutlined />
              </button>
              <button
                className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                title="ลบ"
                onClick={() => handleDeleteForm(form.id)}
              >
                <DeleteOutlined />
              </button>
            </div>
          </>
        )}
      />
    </div>
  );
};

export default FormsListCustom;
