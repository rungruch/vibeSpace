import React, {useEffect, Suspense} from "react";
import { Form, Input, Switch, Card, Row, Col, Typography, Space, Divider, notification, message } from 'antd';
import { SaveOutlined} from '@ant-design/icons';
const PageCreator = React.lazy(() => import(/* webpackChunkName: "editor" */ "../../../../Component/PageCreator.tsx"));
import { PageSettings, PageUpdate } from "../../../Interfaces/interface.ts";
import { EditorMode } from "../../../../enum.ts";
import { useTheme } from "../../../../../context/themeContext.js";
import { useUserContext } from '../../../context/userContext.tsx';
import Loading from "../../../../Component/Loading.tsx";
import { useParams } from "react-router-dom";
import NoMatch from "../../../no-match.js";
import { getPageById, updatePageById } from "../../../../../api/pages.ts";
import { validate as isValidUuid } from 'uuid'

const { Text } = Typography;

//TODO continue fetch page data and appy to pagesettings and pageCreators

export default function PageEdit() {
  const [form] = Form.useForm();
  const user = useUserContext();
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const [pageSettings, setPageSettings] = React.useState<PageSettings>({
    id: id || "",
    is_active: true,
    title: "",
    slug: "",
    content: "",
    created_by: "",
    created_at: null,
    updated_by: "",
    updated_at: null,
  });
  const [isLoading, setLoading] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      if (!id || !isValidUuid(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const pageData = await getPageById(id);
        setPageSettings({
          id: pageData.id,
          is_active: pageData.is_active,
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content,
          created_by: pageData.created_by,
          created_at: pageData.created_at,
          updated_by: pageData.updated_by,
          updated_at: pageData.updated_at,
        });
        // Set form fields to latest data
        form.setFieldsValue({
          is_active: pageData.is_active,
          title: pageData.title,
          slug: pageData.slug,
        });
      } catch (error) {
        console.error("Error fetching page:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSettingsChange = (changedValues: any, allValues: any) => {
    setPageSettings((prev) => ({
      ...prev,
      ...changedValues,
    }));
  };

  const handleSave = async (settings: PageSettings, content: string) => {
    setLoading(true);
    
    // validate empty input and message error
    if (!settings.title || !settings.slug || !content) {
      message.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const pageData: PageUpdate = {
      ...settings,
      content: content,
      updated_by: user.id,
      updated_at: new Date(),
    };

    try {
      const createdPage = await updatePageById(id, pageData);
      
      notification.success({
        message: 'Success!',
        description: 'Page has been created successfully.',
        duration: 4,
      });
    } catch (error) {
      console.error("Error creating page:", error);
      
      notification.error({
        message: 'Error',
        description: error.response.data.message || 'Failed to create page. Please try again.',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

    // If user is not loaded yet, show loading or fallback
  if (!user || pageSettings.content === "") {
    return <Loading />;
  }

  if (notFound) {
    return <NoMatch />;
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

        <Row gutter={[24, 24]} >
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
                form={form}
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
                content={pageSettings.content}
              /></Suspense>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}