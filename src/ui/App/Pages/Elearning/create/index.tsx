import React, { useEffect, Suspense, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
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
import { EditorMode } from "../../../../enum.ts";
import { ElearningVisibility } from "../../../Enum/elearning.ts";
import { useTheme } from "../../../../../context/themeContext.js";
import { useUserContext } from "../../../context/userContext.tsx";
import Loading from "../../../../Component/Loading.tsx";
import { useNavigate } from "react-router-dom";
import SelectFile from "../../../../Component/SelectFile.tsx";
import { SelectFileFilter } from "../../../../enum.ts";
// removed unused useParams/isValidUuid for course create
import NoMatch from "../../../no-match.js";
import { fetchAllCoursesCategory, createCourses, createCourseCategory, deleteCourseCategory } from "../../../../../api/elearning.ts";
import { Elearning, ElearningCoursesCreate, ElearningModuleCreate, ElearningLessonsCreate, ElearningModule, ElearningLessons } from "../../../Interfaces/elearning.ts";

const { Text } = Typography;

export default function CoursesCreate() {
  const user = useUserContext();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [form] = Form.useForm(); // Add form reference
  const [courseSettings, setCourseSettings] = React.useState<Partial<
    Elearning & { modules?: ElearningModuleCreate[] }
  >>({
    is_active: true,
    title: "",
    slug: "",
    description: "",
    objective: "",
    pre_requisites: "",
    duration_minute: 0,
    certificate: false,
    visibility: ElearningVisibility.General,
    password: "",
    start_date: null,
    end_date: null,
    enroll_duration_day: 0,
    created_by: "",
    cover_image_url: "",
    modules: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [Categories, setCategories] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [enableEditCategories, setEnableEditCategories] = React.useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);
  const [selectFileModal, setSelectFileModal] = useState(false);
  const [courseContent, setCourseContent] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categories = await fetchAllCoursesCategory();
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching course categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSettingsChange = (changedValues: any, allValues: any) => {
    setCourseSettings((prev) => ({
      ...prev,
      ...changedValues,
    }));

    // Handle category changes separately
    if (changedValues.category) {
      setSelectedCategories(changedValues.category);
    }
  };

  const handleSave = async (settings: any, content: string) => {
    setIsLoading(true);

    // Merge settings from form and any passed-in settings
    const currentSettings = {
      ...courseSettings,
      ...settings,
    };

    // minimal validation
    if (!currentSettings.title || !currentSettings.slug) {
      message.error("Please fill in the title and slug.");
      setIsLoading(false);
      return;
    }

    // normalize dates from DatePicker (moment) to JS Date
    const startDate = currentSettings.start_date
      ? (currentSettings.start_date as any).toDate
        ? (currentSettings.start_date as any).toDate()
        : new Date(currentSettings.start_date)
      : null;

    const endDate = currentSettings.end_date
      ? (currentSettings.end_date as any).toDate
        ? (currentSettings.end_date as any).toDate()
        : new Date(currentSettings.end_date)
      : null;

    const courseData: ElearningCoursesCreate = {
      is_active: !!currentSettings.is_active,
      slug: currentSettings.slug,
      pre_requisites: currentSettings.pre_requisites || "",
      title: currentSettings.title,
      description: content || currentSettings.description || "",
      objective: currentSettings.objective || "",
      duration_minute: currentSettings.duration_minute || 0,
      certificate: !!currentSettings.certificate,
      visibility:
        (currentSettings.visibility as ElearningVisibility) ||
        ElearningVisibility.General,
      rating: 0, // omitted by create type but include a placeholder if needed by API
      password: currentSettings.password || "",
      start_date: startDate,
      end_date: endDate,
      enroll_duration_day: currentSettings.enroll_duration_day || 0,
      created_by: user.id,
      cover_image_url: currentSettings.cover_image_url || "",
      modules: currentSettings.modules || [],
      category: selectedCategories,
    } as any;

    try {
      await createCourses(courseData);

      notification.success({
        message: "Success!",
        description: "Course has been created successfully.",
        duration: 4,
      });
      navigate(`/elearning`);
    } catch (error: any) {
      console.error("Error creating course:", error);

      notification.error({
        message: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to create course. Please try again.",
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
      const newCategory = await createCourseCategory({
        name: newCategoryName.trim(),
      });

      // Update the categories list
      setCategories((prev) => [...prev, newCategory.category]);

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
      await deleteCourseCategory(categoryId);

      // Update the categories list
      setCategories((prev) =>
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
    setCourseSettings((prev) => ({
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
              สร้างหลักสูตรใหม่
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
                    ตั้งค่าหลักสูตร
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
                  is_active: courseSettings.is_active,
                  title: courseSettings.title,
                  slug: courseSettings.slug,
                  description: courseSettings.description,
                  objective: courseSettings.objective,
                  pre_requisites: courseSettings.pre_requisites,
                  duration_minute: courseSettings.duration_minute,
                  certificate: courseSettings.certificate,
                  visibility: courseSettings.visibility,
                  password: courseSettings.password,
                  enroll_duration_day: courseSettings.enroll_duration_day,
                  start_date: courseSettings.start_date,
                  end_date: courseSettings.end_date,
                  category: selectedCategories,
                  cover_image_url: courseSettings.cover_image_url,
                }}
                onValuesChange={handleSettingsChange}
              >
                <Form.Item
                  label={
                    <Text strong style={{ color: isDark ? "#fff" : "#262626" }}>
                      เปิดใช้งาน
                    </Text>
                  }
                  name="is_active"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="เปิด"
                    unCheckedChildren="ร่าง"
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
                      ชื่อหลักสูตร
                    </Text>
                  }
                  name="title"
                  rules={[{ required: true, message: "Please enter a title" }]}
                  style={{ marginBottom: "20px" }}
                >
                  <Input
                    placeholder="Enter page title..."
                    maxLength={250}
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
                    maxLength={100}
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

                {/* Course specific fields */}
                <Form.Item label="คำอธิบาย (Description)" name="description">
                  <Input.TextArea rows={3} placeholder="Short description..." maxLength={250} />
                </Form.Item>

                <Form.Item label="วัตถุประสงค์ (Objective)" name="objective">
                  <Input.TextArea rows={2} placeholder="Objectives..." maxLength={250} />
                </Form.Item>

                // TODOS Create course select component to get a courses id and input to this input
                <Form.Item label="วิชาพื้นฐาน (Pre-requisites)" name="pre_requisites">
                  <Input.TextArea rows={2} placeholder="Pre-requisites..." />
                </Form.Item>

                <Form.Item label="ระยะเวลาเรียนโดยประมาณ (นาที)" name="duration_minute">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="ใบรับรอง" name="certificate" valuePropName="checked">
                  <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                </Form.Item>

                <Form.Item label="การมองเห็น" name="visibility">
                  <Select>
                    <Select.Option value="general">ทั่วไป</Select.Option>
                    <Select.Option value="password">รหัส</Select.Option>
                    <Select.Option value="invite">เชิญเท่านั้น</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="รหัสผ่าน (if visibility=Password)" name="password">
                  <Input placeholder="Optional password" />
                </Form.Item>

                <Form.Item label="ระยะเวลาในการเรียน (วัน)" name="enroll_duration_day">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="วันที่เริ่มต้น" name="start_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="วันที่สิ้นสุด" name="end_date">
                  <DatePicker style={{ width: '100%' }} />
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
                        หมวดหมู่
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
                    options={Categories.map((category: any) => ({
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
                      Categories
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
                display: "none"
              }}
              styles={{ body: { padding: "24px" } }}
              loading={isLoading}
            >
              {/* <Suspense fallback={<div>Loading editor...</div>}>
                <PageCreator
                  mode={EditorMode.Page}
                  settings={{ ...(courseSettings as any), content: courseContent }}
                  onSave={handleSave}
                  content={courseContent}
                />
              </Suspense> */}
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
