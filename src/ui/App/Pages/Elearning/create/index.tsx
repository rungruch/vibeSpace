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
import SelectForm from "../../../../Component/SelectForm.tsx";
import SelectPage from "../../../../Component/SelectPage.tsx";
import { SelectFileFilter } from "../../../../enum.ts";
// removed unused useParams/isValidUuid for course create
import NoMatch from "../../../no-match.js";
import { fetchAllCoursesCategory, createCourses, createCourseCategory, deleteCourseCategory } from "../../../../../api/elearning.ts";
import { Elearning, ElearningCoursesCreate, ElearningModuleCreate, ElearningLessonsCreate, ElearningModule, ElearningLessons } from "../../../Interfaces/elearning.ts";
import { ElearningMediaType } from "../../../Enum/elearning.ts";

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
  const [notFound, setNotFound] = useState(false);
  const truncate = (s: string | undefined, n = 40) => {
    if (!s) return "";
    return s.length > n ? s.slice(0, n) + "..." : s;
  };
  // lesson edit modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonEditModuleIndex, setLessonEditModuleIndex] = useState<number | null>(null);
  const [lessonEditLessonIndex, setLessonEditLessonIndex] = useState<number | null>(null);
  const [showSelectPage, setShowSelectPage] = useState(false);
  const [showSelectFileForLesson, setShowSelectFileForLesson] = useState(false);
  const [showSelectFormForLesson, setShowSelectFormForLesson] = useState(false);
  // local modules state lives inside courseSettings.modules but keep a typed alias

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

  const handleSave = async (settings: any) => {
    setIsLoading(true);

    // Merge settings from form and any passed-in settings
    const currentSettings = {
      ...courseSettings,
      ...settings,
    };

    // minimal validation: require title, slug, description (or editor content), and cover image
    if (
      !currentSettings.title ||
      !currentSettings.slug ||
      !(currentSettings.description) ||
      !currentSettings.cover_image_url
    ) {
      message.error("Please fill in title, slug, description and cover image.");
      setIsLoading(false);
      return;
    }

    // per-lesson validation: ensure required selector exists depending on lesson type
    const modulesToCheck = currentSettings.modules || [];
    for (let mi = 0; mi < modulesToCheck.length; mi++) {
      const mod = modulesToCheck[mi];
      const lessons = mod.lessons || [];
      for (let li = 0; li < lessons.length; li++) {
        const lesson = lessons[li] as any;
        // min_complete_minute sanity
        if (lesson.min_complete_minute != null && lesson.min_complete_minute < 0) {
          message.error(`Module ${mi + 1} Lesson ${li + 1}: min_complete_minute must be >= 0`);
          setIsLoading(false);
          return;
        }

        if (lesson.type === ElearningMediaType.Editor) {
          if (!lesson.page_slug) {
            message.error(`Module ${mi + 1} Lesson ${li + 1}: please select a Page for Editor lessons.`);
            setIsLoading(false);
            return;
          }
        } else if (lesson.type === ElearningMediaType.Quiz) {
          if (!lesson.quiz_id) {
            message.error(`Module ${mi + 1} Lesson ${li + 1}: please select a Quiz/Form for Quiz lessons.`);
            setIsLoading(false);
            return;
          }
        } else {
          if (!lesson.media_file_url) {
            message.error(`Module ${mi + 1} Lesson ${li + 1}: please select a Media file for this lesson type.`);
            setIsLoading(false);
            return;
          }
        }
      }
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
      slug: currentSettings.slug || "",
      pre_requisites: currentSettings.pre_requisites || "",
      title: currentSettings.title || "",
      description: currentSettings.description || "",
      objective: currentSettings.objective || "",
      duration_minute: Number(currentSettings.duration_minute) || 0,
      certificate: !!currentSettings.certificate,
      visibility:
        (currentSettings.visibility as ElearningVisibility) ||
        ElearningVisibility.General,
      password: currentSettings.password || "",
      start_date: startDate || null,
      end_date: endDate || null,
      enroll_duration_day: Number(currentSettings.enroll_duration_day) || 0,
      created_by: user.id,
      cover_image_url: currentSettings.cover_image_url || "",
      modules: (currentSettings.modules || []),
      category: selectedCategories || [],
    };

    try {
      await createCourses(courseData);

      notification.success({
        message: "Success!",
        description: "Course has been created successfully.",
        duration: 4,
      });
      navigate(`/course/manage`);
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

  // Module & Lesson helpers
  const addModule = () => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []) as ElearningModuleCreate[];
      const newModule: ElearningModuleCreate = {
        title: `Module ${modules.length + 1}`,
        order_index: modules.length + 1,
        lessons: [],
      };
      return { ...prev, modules: [...modules, newModule] };
    });
  };

  const removeModule = (index: number) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      modules.splice(index, 1);
      // reindex order
      modules.forEach((m, i) => (m.order_index = i + 1));
      return { ...prev, modules };
    });
  };

  const updateModuleField = (index: number, field: keyof ElearningModuleCreate, value: any) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const module = { ...modules[index] } as any;
      module[field] = value;
      modules[index] = module;
      return { ...prev, modules };
    });
  };

  const addLesson = (moduleIndex: number) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const module = { ...modules[moduleIndex] } as ElearningModuleCreate;
      const lessons = module.lessons || [];
      const newLesson: ElearningLessonsCreate = {
        title: `Lesson ${module.order_index}.${lessons.length + 1}`,
        type: ElearningMediaType.Editor,
        page_slug: null,
        media_file_url: null,
        quiz_id: null,
        order_index: lessons.length + 1,
        min_complete_minute: 0,
      } as any;
      module.lessons = [...lessons, newLesson];
      modules[moduleIndex] = module;
      return { ...prev, modules };
    });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const module = { ...modules[moduleIndex] } as ElearningModuleCreate;
      const lessons = (module.lessons || []).slice();
      lessons.splice(lessonIndex, 1);
      lessons.forEach((l, i) => (l.order_index = i + 1));
      module.lessons = lessons;
      modules[moduleIndex] = module;
      return { ...prev, modules };
    });
  };

  const updateLessonField = (moduleIndex: number, lessonIndex: number, field: keyof ElearningLessonsCreate, value: any) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const module = { ...modules[moduleIndex] } as ElearningModuleCreate;
      const lessons = (module.lessons || []).slice();
      const lesson = { ...lessons[lessonIndex] } as any;
      lesson[field] = value;
      lessons[lessonIndex] = lesson;
      module.lessons = lessons;
      modules[moduleIndex] = module;
      return { ...prev, modules };
    });
  };

  // Drag & drop state/refs for modules and lessons
  const draggingModuleIndex = React.useRef<number | null>(null);
  const draggingLesson = React.useRef<{ moduleIndex: number; lessonIndex: number } | null>(null);

  // Modules drag handlers
  const onModuleDragStart = (e: React.DragEvent, index: number) => {
    draggingModuleIndex.current = index;
    try { e.dataTransfer?.setData('text/plain', 'module'); } catch (_) {}
  };

  const onModuleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onModuleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const from = draggingModuleIndex.current;
    if (from === null || from === undefined) return;
    if (from === targetIndex) return;
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const [moved] = modules.splice(from, 1);
      modules.splice(targetIndex, 0, moved);
      modules.forEach((m: any, i: number) => (m.order_index = i + 1));
      return { ...prev, modules };
    });
    draggingModuleIndex.current = null;
  };

  // Lessons drag handlers (support move within and between modules)
  const onLessonDragStart = (e: React.DragEvent, moduleIndex: number, lessonIndex: number) => {
    draggingLesson.current = { moduleIndex, lessonIndex };
    try { e.dataTransfer?.setData('text/plain', 'lesson'); } catch (_) {}
  };

  const onLessonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onLessonDrop = (e: React.DragEvent, targetModuleIndex: number, targetLessonIndex: number) => {
    e.preventDefault();
    const src = draggingLesson.current;
    if (!src) return;
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();

      // remove from source
      const srcModule = { ...(modules[src.moduleIndex] || {}) } as any;
      const srcLessons = (srcModule.lessons || []).slice();
      const [moved] = srcLessons.splice(src.lessonIndex, 1);
      srcModule.lessons = srcLessons;
      modules[src.moduleIndex] = srcModule;

      // insert into target
      const targetModule = { ...(modules[targetModuleIndex] || {}) } as any;
      const targetLessons = (targetModule.lessons || []).slice();
      // If dropping after last item, allow append
      const insertIndex = Math.min(Math.max(0, targetLessonIndex), targetLessons.length);
      targetLessons.splice(insertIndex, 0, moved);
      targetModule.lessons = targetLessons;
      modules[targetModuleIndex] = targetModule;

      // reindex lessons order_index for affected modules
      [src.moduleIndex, targetModuleIndex].forEach((mi) => {
        const lessons = (modules[mi]?.lessons || []) as any[];
        lessons.forEach((l, i) => (l.order_index = i + 1));
      });

      return { ...prev, modules };
    });
    draggingLesson.current = null;
  };

  // Drop to append to module (drop on the module area)
  const onModuleLessonsDrop = (e: React.DragEvent, targetModuleIndex: number) => {
    e.preventDefault();
    const src = draggingLesson.current;
    if (!src) return;
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();

      // remove from source
      const srcModule = { ...(modules[src.moduleIndex] || {}) } as any;
      const srcLessons = (srcModule.lessons || []).slice();
      const [moved] = srcLessons.splice(src.lessonIndex, 1);
      srcModule.lessons = srcLessons;
      modules[src.moduleIndex] = srcModule;

      // append to target module
      const targetModule = { ...(modules[targetModuleIndex] || {}) } as any;
      const targetLessons = (targetModule.lessons || []).slice();
      targetLessons.push(moved);
      targetModule.lessons = targetLessons;
      modules[targetModuleIndex] = targetModule;

      // reindex lessons order_index for affected modules
      [src.moduleIndex, targetModuleIndex].forEach((mi) => {
        const lessons = (modules[mi]?.lessons || []) as any[];
        lessons.forEach((l, i) => (l.order_index = i + 1));
      });

      return { ...prev, modules };
    });
    draggingLesson.current = null;
  };

  // Ensure only the relevant lesson fields are present depending on media type
  const handleLessonTypeChange = (moduleIndex: number, lessonIndex: number, val: ElearningMediaType) => {
    setCourseSettings((prev) => {
      const modules = (prev.modules || []).slice();
      const module = { ...modules[moduleIndex] } as ElearningModuleCreate;
      const lessons = (module.lessons || []).slice();
      const lesson = { ...lessons[lessonIndex] } as any;
      lesson.type = val;
      if (val === ElearningMediaType.Editor) {
        // Editor uses only page_slug
        lesson.page_slug = lesson.page_slug || null;
        lesson.media_file_url = null;
        lesson.quiz_id = null;
      } else if (val === ElearningMediaType.Quiz) {
        // Quiz uses only quiz_id
        lesson.quiz_id = lesson.quiz_id || null;
        lesson.page_slug = null;
        lesson.media_file_url = null;
      } else {
        // Video/PDF/etc use media_file_url
        lesson.media_file_url = lesson.media_file_url || null;
        lesson.page_slug = null;
        lesson.quiz_id = null;
      }
      lessons[lessonIndex] = lesson;
      module.lessons = lessons;
      modules[moduleIndex] = module;
      return { ...prev, modules };
    });
  };

  const openLessonModal = (moduleIndex: number, lessonIndex: number) => {
    setLessonEditModuleIndex(moduleIndex);
    setLessonEditLessonIndex(lessonIndex);
    setLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setLessonModalOpen(false);
    setLessonEditModuleIndex(null);
    setLessonEditLessonIndex(null);
  };

  // Save click handler that validates the form and invokes handleSave
  const onSaveClick = async () => {
    try {
      const values = await form.validateFields();
      // merge form values into courseSettings so UI reflects them
      setCourseSettings((prev) => ({ ...prev, ...values }));
      await handleSave(values);
    } catch (err) {
      // validation error: AntD will mark fields; show message
      message.error('Please fix form validation errors before saving.');
    }
  };

  const handleSelectPageForLesson = (routePath: string) => {
    if (lessonEditModuleIndex === null || lessonEditLessonIndex === null) return;
  updateLessonField(lessonEditModuleIndex, lessonEditLessonIndex, 'page_slug' as any, routePath.split('/').pop()); // return only slug
    setShowSelectPage(false);
  };

  const handleSelectFileForLesson = (staticUrl: string) => {
    if (lessonEditModuleIndex === null || lessonEditLessonIndex === null) return;
  updateLessonField(lessonEditModuleIndex, lessonEditLessonIndex, 'media_file_url' as any, staticUrl);
    setShowSelectFileForLesson(false);
  };

  const handleSelectFormForLesson = (id: string) => {
    if (lessonEditModuleIndex === null || lessonEditLessonIndex === null) return;
    updateLessonField(lessonEditModuleIndex, lessonEditLessonIndex, 'quiz_id' as any, id);
    setShowSelectFormForLesson(false);
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
    <div className={`min-h-screen p-6 transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-[1400px] mx-auto">
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
          <div className="flex items-center gap-2">
            <Button type="primary" icon={<SaveOutlined />} onClick={onSaveClick}>
              Save
            </Button>
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
                <Form.Item
                  label="คำอธิบาย (Description)"
                  name="description"
                  rules={[{ required: true, message: "Please enter a description" }]}
                >
                  <Input.TextArea rows={3} placeholder="Short description..." maxLength={250} />
                </Form.Item>

                <Form.Item label="วัตถุประสงค์ (Objective)" name="objective">
                  <Input.TextArea rows={2} placeholder="Objectives..." maxLength={250} />
                </Form.Item>

                {/* TODOS: Create course select component to get a courses id and input to this input */}
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

                {/* // CURRENTLY NOT IMPLEMENTED DUE TO COMPLEXITY
                */}

                {/* <Form.Item label="ระยะเวลาในการเรียน (วัน)" name="enroll_duration_day">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item> */}

                <Form.Item label="วันที่เริ่มต้น (ระยะเวลาที่เปิดลงทะเบียนเรียน)" name="start_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="วันที่สิ้นสุด" name="end_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label={
                    <div className="flex justify-between items-center w-full">
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
                        className={`${isDark ? 'text-blue-400' : 'text-blue-600'} p-0`}
                      >
                        Add Category
                      </Button>

                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEnableEditCategories((previous) => !previous)}
                        className={`${isDark ? 'text-blue-400' : 'text-blue-600'} p-0`}
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

                <Form.Item
                  label="ภาพหน้าปก"
                  name="cover_image_url"
                  rules={[{ required: true, message: "Please select or enter a cover image" }]}
                >
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

          {/* Second Panel */}
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
                
              {/* Module & Lesson editor UI */}
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Button onClick={() => addModule()} icon={<PlusOutlined />}>add Module</Button>
                </div>

                {(courseSettings.modules || []).map((mod: any, mi: number) => {
                  return (
                    <div key={mi}
                      draggable
                      onDragStart={(e) => onModuleDragStart(e, mi)}
                      onDragOver={onModuleDragOver}
                      onDrop={(e) => onModuleDrop(e, mi)}
                      className={`border rounded-lg p-3 mb-3 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Input
                          value={mod.title}
                          onChange={(e) => updateModuleField(mi, 'title', e.target.value)}
                          style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button danger onClick={() => removeModule(mi)}>Remove Module</Button>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Button onClick={() => addLesson(mi)}>add Lesson</Button>
                        </div>

                        <div onDragOver={onLessonDragOver} onDrop={(e) => onModuleLessonsDrop(e, mi)}>
                          {(mod.lessons || []).map((les: any, li: number) => {
                            return (
                              <div key={li}
                                draggable
                                onDragStart={(e) => onLessonDragStart(e, mi, li)}
                                onDragOver={onLessonDragOver}
                                onDrop={(e) => onLessonDrop(e, mi, li)}
                                className={`flex items-center gap-2 p-2 rounded-md mb-2 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <div style={{ width: 28 }}>{`${mi + 1}.${li + 1}`}</div>
                                <Input value={les.title} onChange={(e) => updateLessonField(mi, li, 'title', e.target.value)} />
                                <Select value={les.type} onChange={(val) => handleLessonTypeChange(mi, li, val as ElearningMediaType)} style={{ width: 140 }}>
                                  <Select.Option value={ElearningMediaType.Editor}>Editor</Select.Option>
                                  <Select.Option value={ElearningMediaType.Video}>Video</Select.Option>
                                  <Select.Option value={ElearningMediaType.PDF}>PDF</Select.Option>
                                  <Select.Option value={ElearningMediaType.Quiz}>Quiz</Select.Option>
                                </Select>
                                <InputNumber value={les.min_complete_minute} min={0} onChange={(v) => updateLessonField(mi, li, 'min_complete_minute', v || 0)} style={{ width: 120 }} />
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
                                  <div style={{ fontSize: 12, color: isDark ? '#ddd' : '#444' }}>{les.type === ElearningMediaType.Editor ? `Page: ${truncate(les.page_slug)}` : les.type === ElearningMediaType.Quiz ? `Quiz: ${truncate(les.quiz_id)}` : `File: ${truncate(les.media_file_url)}`}</div>
                                  <div style={{ fontSize: 12, color: isDark ? '#bbb' : '#666' }}>Min min: {les.min_complete_minute ?? 0}</div>
                                </div>
                                <Button style={{ padding: '0 16px' }} onClick={() => openLessonModal(mi, li)} icon={<EditOutlined />} />
                                <Button style={{ padding: '0 16px' }} danger onClick={() => removeLesson(mi, li)} icon={<DeleteOutlined />} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* Lesson Edit Modal */}
        <Modal
          title="Edit Lesson"
          open={lessonModalOpen}
          onCancel={closeLessonModal}
          footer={null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Show selector based on lesson type */}
            {lessonEditModuleIndex !== null && lessonEditLessonIndex !== null && (() => {
              const lesson = ((courseSettings.modules || [])[lessonEditModuleIndex]?.lessons || [])[lessonEditLessonIndex] || {} as any;
              if (lesson.type === ElearningMediaType.Editor) {
                return <Button onClick={() => setShowSelectPage(true)}>Select Page</Button>;
              } else if (lesson.type === ElearningMediaType.Quiz) {
                return <Button onClick={() => setShowSelectFormForLesson(true)}>Select Quiz/Form</Button>;
              } else {
                return <Button onClick={() => setShowSelectFileForLesson(true)}>Select Media File</Button>;
              }
            })()}

            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Minimum complete minutes</label>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={lessonEditModuleIndex !== null && lessonEditLessonIndex !== null ? (((courseSettings.modules || [])[lessonEditModuleIndex]?.lessons || [])[lessonEditLessonIndex]?.min_complete_minute ?? 0) : 0}
                onChange={(v) => {
                  if (lessonEditModuleIndex === null || lessonEditLessonIndex === null) return;
                  updateLessonField(lessonEditModuleIndex, lessonEditLessonIndex, 'min_complete_minute' as any, v || 0);
                }}
              />
            </div>

            {process.env.DEV_MODE === "development" && (
              <div>
                <p style={{ marginBottom: 6 }}>Preview values (will be saved when modal closed):</p>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 8, borderRadius: 6 }}>
                  {JSON.stringify(
                    lessonEditModuleIndex !== null && lessonEditLessonIndex !== null
                      ? ((courseSettings.modules || [])[lessonEditModuleIndex]?.lessons || [])[lessonEditLessonIndex]
                      : {},
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={closeLessonModal}>Close</Button>
            </div>
          </div>
        </Modal>

        <SelectFile
          visible={selectFileModal}
          onClose={() => setSelectFileModal(false)}
          onSelect={handleSelectFile}
          filterType={SelectFileFilter.IMAGE}
        />

        {/* Selectors for lesson modal */}
        <SelectPage
          visible={showSelectPage}
          onClose={() => setShowSelectPage(false)}
          onSelect={handleSelectPageForLesson}
        />

        <SelectFile
          visible={showSelectFileForLesson}
          onClose={() => setShowSelectFileForLesson(false)}
          onSelect={handleSelectFileForLesson}
          filterType={SelectFileFilter.ALL}
        />

        <SelectForm
          visible={showSelectFormForLesson}
          onClose={() => setShowSelectFormForLesson(false)}
          onSelect={handleSelectFormForLesson}
        />
      </div>
    </div>
  );
}
