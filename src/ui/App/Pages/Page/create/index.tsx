import React, { Suspense } from "react";
import { Form, Input, Switch, Card, Row, Col, Typography, Space, Divider, notification, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
const PageCreator = React.lazy(() => import(/* webpackChunkName: "editor" */ "../../../../Component/PageCreator.tsx"));
import { PageSettings } from "../../../Interfaces/interface.ts";
import { EditorMode } from "../../../../enum.ts";
import { createPage } from "../../../../../api/pages.ts";
import { useTheme } from "../../../../../context/themeContext.js";
import { useUserContext } from '../../../context/userContext.tsx';
import Loading from "../../../../Component/Loading.tsx";
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export default function PageCreate() {
  const user = useUserContext();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [pageSettings, setPageSettings] = React.useState<PageSettings>({
    is_active: true,
    title: "",
    slug: "",
    content: "",
    created_by: "",
    created_at: null,
    updated_by: "",
    updated_at: null,
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSettingsChange = (changedValues: any, allValues: any) => {
    setPageSettings((prev) => ({
      ...prev,
      ...changedValues,
    }));
  };

  const handleSave = async (settings: PageSettings, content: string) => {
    setIsLoading(true);
    
    // validate empty input and message error
    if (!settings.title || !settings.slug || !content) {
      message.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const pageData = {
      ...settings,
      content: content,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const createdPage = await createPage(pageData);
      
      notification.success({
        message: 'Success!',
        description: 'Page has been created successfully.',
        duration: 4,
      });
      navigate(`/settings`);
    } catch (error) {
      console.error("Error creating page:", error);
      
      notification.error({
        message: 'Error',
        description: error.response.data.message || 'Failed to create page. Please try again.',
        duration: 4,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    notification.info({
      message: 'Preview',
      description: 'Preview functionality coming soon!',
      duration: 3,
    });
  };

    // If user is not loaded yet, show loading or fallback
  if (!user) {
    return <Loading />;
  }

  return (
    <div style={{ 
      backgroundColor: isDark ? '#27272a' : '#f5f5f5', 
      minHeight: '100vh',
      padding: '24px',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Kanit, sans-serif' }}>
              สร้างหน้าใหม่
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: 'Kanit, sans-serif' }}>
              สร้างและจัดการเนื้อหา
            </p>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* Settings Panel */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <SaveOutlined style={{ color: isDark ? '#fff' : '#1890ff' }} />
                  <span style={{ color: isDark ? '#fff' : '#262626' }}>Page Settings</span>
                </Space>
              }
              style={{ 
                height: 'fit-content',
                borderRadius: '12px',
                boxShadow: isDark 
                  ? '0 4px 16px rgba(0,0,0,0.3)' 
                  : '0 4px 16px rgba(0,0,0,0.1)',
                border: isDark ? '1px solid #434343' : '1px solid #e8e8f0',
                backgroundColor: isDark ? '#1f1f1f' : '#fff',
                transition: 'all 0.3s ease'
              }}
              styles={{
                header: {
                  background: isDark 
                    ? 'linear-gradient(90deg, #262626 0%, #1f1f1f 100%)' 
                    : 'linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)',
                  borderRadius: '12px 12px 0 0',
                  borderBottom: isDark ? '2px solid #434343' : '2px solid #e8e8f0',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <Form
                layout="vertical"
                initialValues={{
                  is_active: pageSettings.is_active,
                  title: pageSettings.title,
                  slug: pageSettings.slug,
                }}
                onValuesChange={handleSettingsChange}
              >
                <Form.Item 
                  label={
                    <Text strong style={{ color: isDark ? '#fff' : '#262626' }}>
                      Publication Status
                    </Text>
                  } 
                  name="is_active" 
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="Published" 
                    unCheckedChildren="Draft"
                    style={{ marginTop: '4px' }}
                  />
                </Form.Item>
                
                <Divider style={{ 
                  margin: '16px 0',
                  borderColor: isDark ? '#434343' : '#f0f0f0'
                }} />
                
                <Form.Item 
                  label={
                    <Text strong style={{ color: isDark ? '#fff' : '#262626' }}>
                      Page Title
                    </Text>
                  } 
                  name="title" 
                  rules={[{ required: true, message: 'Please enter a title' }]}
                  style={{ marginBottom: '20px' }}
                >
                  <Input 
                    placeholder="Enter page title..."
                    style={{ 
                      borderRadius: '8px',
                      border: isDark ? '2px solid #434343' : '2px solid #e8e8f0',
                      padding: '10px 12px',
                      backgroundColor: isDark ? '#262626' : '#fff',
                      color: isDark ? '#fff' : '#000',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Item>
                
                <Form.Item 
                  label={
                    <Text strong style={{ color: isDark ? '#fff' : '#262626' }}>
                      URL Slug
                    </Text>
                  } 
                  name="slug" 
                  rules={[{ required: true, message: 'Please enter a slug' }]}
                  extra={
                    <Text type="secondary" style={{ 
                      fontSize: '12px',
                      color: isDark ? '#888' : '#666'
                    }}>
                      This will be part of the page URL
                    </Text>
                  }
                >
                  <Input 
                    placeholder="page-url-slug"
                    style={{ 
                      borderRadius: '8px',
                      border: isDark ? '2px solid #434343' : '2px solid #e8e8f0',
                      padding: '10px 12px',
                      backgroundColor: isDark ? '#262626' : '#fff',
                      color: isDark ? '#fff' : '#000',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Item>

                <Divider style={{ 
                  margin: '20px 0',
                  borderColor: isDark ? '#434343' : '#f0f0f0'
                }} />

              </Form>
            </Card>
          </Col>

          {/* Editor Panel */}
          <Col xs={24} lg={16}>
            <Card
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8f0',
                minHeight: '600px'
              }}
              styles={{ body: { padding: '24px' } }}
              loading={isLoading}
            >
              <Suspense fallback={<div>Loading editor...</div>}><PageCreator 
                mode={EditorMode.Page} 
                settings={pageSettings} 
                onSave={handleSave} 
              /></Suspense>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}