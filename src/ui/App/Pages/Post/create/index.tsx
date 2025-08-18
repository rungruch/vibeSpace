import React, { useEffect, Suspense, useState } from "react";
import {
  Form,
  Input,
  Switch,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Button,
  notification,
  message,
  Select,
  Modal,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
const PageCreator = React.lazy(
  () =>
    import(
      /* webpackChunkName: "editor" */ "../../../../Component/PageCreator.tsx"
    )
);
import { PostSettings } from "../../../Interfaces/interface.ts";
import { EditorMode } from "../../../../enum.ts";
import {
  createPost,
  fetchAllPostsCategory,
  createPostCategory,
  deletePostCategory,
  getPostById,
  updatePostById,
} from "../../../../../api/posts.ts";
import { useTheme } from "../../../../../context/themeContext.js";
import { useUserContext } from "../../../context/userContext.tsx";
import Loading from "../../../../Component/Loading.tsx";
import { useNavigate } from "react-router-dom";
import SelectFile from "../../../../Component/SelectFile.tsx";
import { SelectFileFilter } from "../../../../enum.ts";
import { useParams } from "react-router-dom";
import { validate as isValidUuid } from "uuid";
import NoMatch from "../../../no-match.js";

//

//TODOS 1.continue post creator(x) and edit flow (high priority) 2. (x)Create user posts page (displayed but add category later)  3.(x) Create Main Page 4. Create Announcement Management
//#2 Create Elearning Course Page, Elearning User Page, Elearning Details Page
//#3 Elearning Register and Render Page
//#3.1 Learning Status Loggin
//#3.2 My Course Page

//1.1 Create File Explorer Component and Use in import cover image upload

const { Text } = Typography;

export default function PostCreate() {
  const user = useUserContext();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [form] = Form.useForm(); // Add form reference
  const [postSettings, setPostSettings] = React.useState<PostSettings>({
    is_active: true,
    title: "",
    slug: "",
    content: "",
    created_by: "",
    created_at: null,
    updated_by: "",
    updated_at: null,
    category: [],
    cover_image_url: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [postCategories, setPostCategories] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [enableEditCategories, setEnableEditCategories] = React.useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);
  const [selectFileModal, setSelectFileModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Edit Part
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        if (window.location.pathname.includes("/post/edit") && !id) {
          if (!id || !isValidUuid(id)) {
            setNotFound(true);
            setIsLoading(false);
            return;
          }
        }
        const categories = await fetchAllPostsCategory();
        setPostCategories(categories);

        if (id) {
          const post = await getPostById(id);
          // Convert category objects to array of ids
          const categoryIds = Array.isArray(post.categories)
            ? post.categories.map((cat: any) => cat.id)
            : [];

          setPostSettings({
            is_active: post.is_active,
            title: post.title,
            slug: post.slug,
            content: post.content,
            created_by: post.created_by,
            created_at: post.created_at,
            updated_by: post.updated_by,
            updated_at: post.updated_at,
            category: categoryIds,
            cover_image_url: post.cover_image_url,
          });
          setSelectedCategories(categoryIds);

          form.setFieldValue("is_active", post.is_active);
          form.setFieldValue("title", post.title);
          form.setFieldValue("slug", post.slug);
          form.setFieldValue("category", categoryIds);
          form.setFieldValue("cover_image_url", post.cover_image_url);

          console.log(JSON.parse(post.content));

          setPostContent(post.content);
        }
      } catch (error) {
        console.error("Error fetching post categories:", error);
      } finally {
        setIsLoading(false)
      }
    };

    fetchCategories();
  }, [id]);

  const handleSettingsChange = (changedValues: any, allValues: any) => {
    setPostSettings((prev) => ({
      ...prev,
      ...changedValues,
    }));

    // Handle category changes separately
    if (changedValues.category) {
      setSelectedCategories(changedValues.category);
    }
  };

  const handleSave = async (settings: PostSettings, content: string) => {
    setIsLoading(true);

    // Use the current postSettings state instead of the passed settings
    const currentSettings = {
      ...postSettings,
      ...settings, // Merge with any settings passed from PageCreator
    };

    // validate empty input and message error
    if (!currentSettings.title || !currentSettings.slug || !content) {
      message.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const pageData = {
      ...currentSettings,
      content: content,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date(),
      updated_at: new Date(),
      category: selectedCategories, // Use the selected categories
      cover_image_url: currentSettings.cover_image_url, // Use the actual uploaded image URL
    };

    try {
      if (id) {
        await updatePostById(id, pageData);
      } else {
        await createPost(pageData);
      }

      notification.success({
        message: "Success!",
        description: "Post has been updated successfully.",
        duration: 4,
      });
      navigate(`/settings`);
    } catch (error) {
      console.error("Error creating post:", error);

      notification.error({
        message: "Error",
        description:
          error.response.data.message ||
          "Failed to create post. Please try again.",
        duration: 4,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error("Please enter a category name.");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const newCategory = await createPostCategory({
        name: newCategoryName.trim(),
      });

      // Update the categories list
      setPostCategories((prev) => [...prev, newCategory.category]);

      // Clear the input and close modal
      setNewCategoryName("");
      setIsCreateModalOpen(false);

      notification.success({
        message: "Success!",
        description: "Category created successfully.",
        duration: 3,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      notification.error({
        message: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create category. Please try again.",
        duration: 4,
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    try {
      await deletePostCategory(categoryId);

      // Update the categories list
      setPostCategories((prev) =>
        prev.filter((cat: any) => cat.id !== categoryId)
      );

      // Remove from selected categories if it was selected
      const updatedSelectedCategories = selectedCategories.filter(
        (id) => id !== categoryId
      );
      setSelectedCategories(updatedSelectedCategories);

      // Update the form field value to sync with Ant Design
      form.setFieldsValue({ category: updatedSelectedCategories });

      notification.success({
        message: "Success!",
        description: `Category "${categoryName}" deleted successfully.`,
        duration: 3,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      notification.error({
        message: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete category. Please try again.",
        duration: 4,
      });
    }
  };

  // Replace cover image upload with select file
  const handleSelectFile = (staticUrl: string) => {
    form.setFieldsValue({ cover_image_url: staticUrl });
    setPostSettings((prev) => ({
      ...prev,
      cover_image_url: staticUrl,
    }));
    setSelectFileModal(false);
  };

  // If user is not loaded yet, show loading or fallback
  if (!user || isLoading) {
    return <Loading />;
  }

  if (notFound) {
    return <NoMatch />;
  }

  return (
    <div
      style={{
        backgroundColor: isDark ? "#27272a" : "#f5f5f5",
        minHeight: "100vh",
        padding: "24px",
        transition: "background-color 0.3s ease",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2
              className={`text-2xl font-bold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
              style={{ fontFamily: "Kanit, sans-serif" }}
            >
              สร้างหน้าใหม่
            </h2>
            <p
              className={`text-lg ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
              style={{ fontFamily: "Kanit, sans-serif" }}
            >
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
                  <SaveOutlined
                    style={{ color: isDark ? "#fff" : "#1890ff" }}
                  />
                  <span style={{ color: isDark ? "#fff" : "#262626" }}>
                    Page Settings
                  </span>
                </Space>
              }
              style={{
                height: "fit-content",
                borderRadius: "12px",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0,0,0,0.3)"
                  : "0 4px 16px rgba(0,0,0,0.1)",
                border: isDark ? "1px solid #434343" : "1px solid #e8e8f0",
                backgroundColor: isDark ? "#1f1f1f" : "#fff",
                transition: "all 0.3s ease",
              }}
              styles={{
                header: {
                  background: isDark
                    ? "linear-gradient(90deg, #262626 0%, #1f1f1f 100%)"
                    : "linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)",
                  borderRadius: "12px 12px 0 0",
                  borderBottom: isDark
                    ? "2px solid #434343"
                    : "2px solid #e8e8f0",
                  transition: "all 0.3s ease",
                },
              }}
            >
              <Form
                form={form} // Add form reference
                layout="vertical"
                initialValues={{
                  is_active: postSettings.is_active,
                  title: postSettings.title,
                  slug: postSettings.slug,
                  category: selectedCategories,
                  cover_image_url: postSettings.cover_image_url,
                }}
                onValuesChange={handleSettingsChange}
              >
                <Form.Item
                  label={
                    <Text strong style={{ color: isDark ? "#fff" : "#262626" }}>
                      Publication Status
                    </Text>
                  }
                  name="is_active"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Published"
                    unCheckedChildren="Draft"
                    style={{ marginTop: "4px" }}
                  />
                </Form.Item>

                <Divider
                  style={{
                    margin: "16px 0",
                    borderColor: isDark ? "#434343" : "#f0f0f0",
                  }}
                />

                <Form.Item
                  label={
                    <Text strong style={{ color: isDark ? "#fff" : "#262626" }}>
                      Page Title
                    </Text>
                  }
                  name="title"
                  rules={[{ required: true, message: "Please enter a title" }]}
                  style={{ marginBottom: "20px" }}
                >
                  <Input
                    placeholder="Enter page title..."
                    style={{
                      borderRadius: "8px",
                      border: isDark
                        ? "2px solid #434343"
                        : "2px solid #e8e8f0",
                      padding: "10px 12px",
                      backgroundColor: isDark ? "#262626" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      transition: "all 0.3s ease",
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <Text strong style={{ color: isDark ? "#fff" : "#262626" }}>
                      URL Slug
                    </Text>
                  }
                  name="slug"
                  rules={[{ required: true, message: "Please enter a slug" }]}
                  extra={
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        color: isDark ? "#888" : "#666",
                      }}
                    >
                      This will be part of the page URL
                    </Text>
                  }
                >
                  <Input
                    placeholder="page-url-slug"
                    style={{
                      borderRadius: "8px",
                      border: isDark
                        ? "2px solid #434343"
                        : "2px solid #e8e8f0",
                      padding: "10px 12px",
                      backgroundColor: isDark ? "#262626" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      transition: "all 0.3s ease",
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <div
                      style={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Text
                        strong
                        style={{ color: isDark ? "#fff" : "#262626" }}
                      >
                        Categories
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                          color: isDark ? "#40a9ff" : "#1890ff",
                          padding: "0 4px",
                          height: "auto",
                          marginLeft: "10px",
                        }}
                      >
                        Add Category
                      </Button>

                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() =>
                          setEnableEditCategories((previous) => !previous)
                        }
                        style={{
                          color: isDark ? "#40a9ff" : "#1890ff",
                          padding: "0 4px",
                          height: "auto",
                          marginLeft: "10px",
                        }}
                      >
                        Edit Category
                      </Button>
                    </div>
                  }
                  name="category"
                  extra={
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        color: isDark ? "#888" : "#666",
                      }}
                    >
                      Select one or more categories for this post
                    </Text>
                  }
                >
                  <Select
                    mode="multiple"
                    placeholder="Select categories..."
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                    }}
                    options={postCategories.map((category: any) => ({
                      label: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {enableEditCategories && (
                            <Popconfirm
                              title="Delete Category"
                              description={`Are you sure you want to delete "${category.name}"?`}
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                handleDeleteCategory(
                                  category.id,
                                  category.name
                                );
                              }}
                              onCancel={(e) => e?.stopPropagation()}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  color: "#ff4d4f",
                                  padding: "0 4px",
                                  height: "auto",
                                  minWidth: "auto",
                                  marginRight: "4px",
                                }}
                              />
                            </Popconfirm>
                          )}
                          <span>{category.name}</span>
                        </div>
                      ),
                      value: category.id,
                    }))}
                    filterOption={(input, option) =>
                      postCategories
                        .find((cat: any) => cat.id === option?.value)
                        ?.name?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    showSearch
                    allowClear
                    maxTagCount="responsive"
                  />
                </Form.Item>

                <Form.Item label="ภาพหน้าปก" name="cover_image_url">
                  <div>
                    <Input
                      placeholder="เลือกไฟล์หรือวางลิงก์ภาพ"
                      addonAfter={
                        <Button onClick={() => setSelectFileModal(true)}>
                          เลือกจากไฟล์
                        </Button>
                      }
                    />
                    {form.getFieldValue("cover_image_url") && (
                      <div style={{ marginTop: 12 }}>
                        <img
                          src={form.getFieldValue("cover_image_url")}
                          alt="cover preview"
                          style={{
                            maxWidth: 180,
                            maxHeight: 180,
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                          onError={(e) => {
                            form.setFieldsValue({ cover_image_url: "" });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Form.Item>

                <Divider
                  style={{
                    margin: "20px 0",
                    borderColor: isDark ? "#434343" : "#f0f0f0",
                  }}
                />
              </Form>
            </Card>
          </Col>

          {/* Editor Panel */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                border: "1px solid #e8e8f0",
                minHeight: "600px",
              }}
              styles={{ body: { padding: "24px" } }}
              loading={isLoading}
            >
              <Suspense fallback={<div>Loading editor...</div>}>
                <PageCreator
                  mode={EditorMode.Page}
                  settings={postSettings}
                  onSave={handleSave}
                  content={id ? postContent : ""}
                />
              </Suspense>
            </Card>
          </Col>
        </Row>

        {/* Create Category Modal */}
        <Modal
          title="Create New Category"
          open={isCreateModalOpen}
          onOk={handleCreateCategory}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setNewCategoryName("");
          }}
          confirmLoading={isCreatingCategory}
          okText="Create"
          cancelText="Cancel"
        >
          <Form layout="vertical">
            <Form.Item
              label="Category Name"
              rules={[
                { required: true, message: "Please enter a category name" },
              ]}
            >
              <Input
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onPressEnter={handleCreateCategory}
                style={{
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              />
            </Form.Item>
          </Form>
        </Modal>

        <SelectFile
          visible={selectFileModal}
          onClose={() => setSelectFileModal(false)}
          onSelect={handleSelectFile}
          filterType={SelectFileFilter.IMAGE}
        />
      </div>
    </div>
  );
}
