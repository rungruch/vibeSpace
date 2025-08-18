import React, { useEffect, useState } from 'react';
import { Modal, List, Input, Button } from 'antd';
import { getFiles } from '../../api/file.ts';
import { SelectFileFilter } from '../enum.ts';
import { EyeOutlined } from '@ant-design/icons';

interface SelectFileProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (staticUrl: string) => void;
  filterType?: SelectFileFilter;
}

const SelectFile: React.FC<SelectFileProps> = ({ visible, onClose, onSelect, filterType = SelectFileFilter.ALL }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getFiles().then(res => {
        setFiles(res.files || []);
      }).finally(() => setLoading(false));
    }
  }, [visible]);

  const filteredFiles = files.filter(file => {
    const matchSearch = file.filename.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'IMAGE') {
      return matchSearch && file.type && file.type.startsWith('image/');
    }
    if (filterType === 'VIDEO') {
      return matchSearch && file.type && file.type.startsWith('video/');
    }
    if (filterType === 'PDF') {
      return matchSearch && file.type === 'application/pdf';
    }
    return matchSearch;
  });

  const paginatedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function onPreview(staticUrl: any): void {
    window.open(staticUrl, '_blank');
  }

  return (
    <Modal
      title="เลือกไฟล์จากระบบ"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Input
        placeholder="ค้นหาไฟล์..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <List
        loading={loading}
        dataSource={paginatedFiles}
        renderItem={file => (
          <List.Item
            actions={[
              <Button key="select" type="primary" onClick={() => onSelect(file.staticUrl)}>
                เลือกไฟล์นี้
              </Button>,
              <Button key="preview" type="default" icon={<EyeOutlined />} onClick={() => onPreview(file.staticUrl)}>
                ดูตัวอย่าง
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={file.type && file.type.startsWith('image/') ? (
                <img src={file.staticUrl} alt={file.filename} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
              ) : file.type === 'application/pdf' ? (
                <span style={{ width: 48, height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fdecea', color: '#d4380d', borderRadius: 8, fontWeight: 'bold' }}>PDF</span>
              ) : (
                <span style={{ width: 48, height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', color: '#595959', borderRadius: 8, fontWeight: 'bold' }}>FILE</span>
              )}
              title={file.filename}
              description={file.type}
            />
          </List.Item>
        )}
      />
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          style={{ marginRight: 8 }}
        >ก่อนหน้า</Button>
        <span>หน้า {currentPage} / {Math.max(1, Math.ceil(filteredFiles.length / pageSize))}</span>
        <Button
          disabled={currentPage === Math.ceil(filteredFiles.length / pageSize) || filteredFiles.length === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
          style={{ marginLeft: 8 }}
        >ถัดไป</Button>
      </div>
    </Modal>
  );
};

export default SelectFile;
