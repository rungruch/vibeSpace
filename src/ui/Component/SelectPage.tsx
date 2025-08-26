import React, { useEffect, useState } from 'react';
import { Modal, List, Input, Button } from 'antd';
import { fetchAllPages } from '../../api/pages.ts';
import { EyeOutlined } from '@ant-design/icons';

interface SelectPageProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (routePath: string) => void;
}

const SelectPage: React.FC<SelectPageProps> = ({ visible, onClose, onSelect }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchAllPages().then(res => {
        setPages(res || []);
      }).finally(() => setLoading(false));
    }
  }, [visible]);

  const filteredPages = pages.filter(page => {
    return page.title && page.title.toLowerCase().includes(search.toLowerCase());
  });

  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function onPreview(slug: string): void {
    window.open(`/page/${slug}`, '_blank');
  }

  return (
    <Modal
      title="เลือกเพจ"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Input
        placeholder="ค้นหาเพจ..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          onClick={() => window.open('/page/create', '_blank')}
        >
          สร้างเพจใหม่
        </Button>
      </div>
      <List
        loading={loading}
        dataSource={paginatedPages}
        renderItem={page => (
          <List.Item
            actions={[
              <Button key="select" type="primary" onClick={() => onSelect(`/page/${page.slug}`)}>
                เลือกเพจนี้
              </Button>,
              <Button key="preview" type="default" icon={<EyeOutlined />} onClick={() => onPreview(page.slug)}>
                ดูตัวอย่าง
              </Button>
            ]}
          >
            <List.Item.Meta
              title={page.title}
              description={page.slug}
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
        <span>หน้า {currentPage} / {Math.max(1, Math.ceil(filteredPages.length / pageSize))}</span>
        <Button
          disabled={currentPage === Math.ceil(filteredPages.length / pageSize) || filteredPages.length === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
          style={{ marginLeft: 8 }}
        >ถัดไป</Button>
      </div>
    </Modal>
  );
};

export default SelectPage;
