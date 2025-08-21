import React, { useEffect, useState } from 'react';
import { Modal, List, Input, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { fetchAllForms } from '../../api/forms';
import { useUserContext } from '../App/context/userContext.tsx';

interface SelectFormProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const SelectForm: React.FC<SelectFormProps> = ({ visible, onClose, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [userForms, setUserForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const user = useUserContext();

  useEffect(() => {
    async function fetchUserForms() {
      try {
        setIsLoading(true);
        const forms = await fetchAllForms(user.id);
        // API may return an array or an object containing the array; normalize both
        const normalized = Array.isArray(forms) ? forms : (forms?.forms || forms?.data || []);
        setUserForms(normalized);
      } catch (error) {
        console.error('Error fetching forms:', error);
        setUserForms([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (visible && user?.id) {
      fetchUserForms();
    }
    if (!visible) {
      // reset local UI state when closed
      setSearchText('');
      setCurrentPage(1);
    }
  }, [visible, user]);

  const filteredForms = userForms.filter(f => {
    if (!f) return false;
    const title = (f.title || '').toString();
    return title.toLowerCase().includes(searchText.toLowerCase());
  });

  const paginatedForms = filteredForms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function onPreview(slug: string | undefined, id: string) {
    const path = slug ? `/form/${slug}` : `/form/${id}`;
    window.open(path, '_blank');
  }

  return (
    <Modal
      title="เลือกฟอร์มจากระบบ"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Input
        placeholder="ค้นหาฟอร์ม..."
        value={searchText}
        onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
        style={{ marginBottom: 16 }}
      />

      <List
        loading={isLoading}
        dataSource={paginatedForms}
        renderItem={form => (
          <List.Item
            actions={[
              <Button key="select" type="primary" onClick={() => onSelect(form.SurveyID || form.id || '')}>
                เลือกฟอร์มนี้
              </Button>,
              <Button key="preview" type="default" icon={<EyeOutlined />} onClick={() => onPreview(form.slug, form.SurveyID || form.id || '')}>
                ดูตัวอย่าง
              </Button>
            ]}
          >
            <List.Item.Meta
              title={form.title}
              description={`${form.type || ''} • ${form.slug || form.SurveyID || ''}`}
            />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999' }}>Responses</div>
              <div style={{ fontWeight: 600 }}>{form.UserResponseCount ?? 0}</div>
            </div>
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          style={{ marginRight: 8 }}
        >ก่อนหน้า</Button>
        <span>หน้า {currentPage} / {Math.max(1, Math.ceil(filteredForms.length / pageSize))}</span>
        <Button
          disabled={currentPage === Math.ceil(filteredForms.length / pageSize) || filteredForms.length === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
          style={{ marginLeft: 8 }}
        >ถัดไป</Button>
      </div>
    </Modal>
  );
};

export default SelectForm;