// info page and learning layout
// TODOS create elearning course info section + register flow (if registered show as continue and process)
// #2 learning layout show learning path current procress -> content container includes editor pdf and video with save progress and continue lessons restriction logic
import React, { useEffect, Suspense, useState } from "react";
import {
  getCourseAndEnrollStatusBySlug,
  getCourseBySlug,
  enrollCourses,
} from "../../../../api/elearning.ts";
import {
  Elearning,
  ElearningCoursesCreate,
  ElearningModuleCreate,
  ElearningLessonsCreate,
  ElearningModule,
  ElearningLessons,
  ElearningCourseGet,
} from "../../Interfaces/elearning.ts";
import { useParams } from "react-router-dom";
import NoMatch from "../../no-match.js";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import GradeIcon from "@mui/icons-material/Grade";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { App, Button, Tag, Tabs, Modal, message } from "antd";
import LearningPath from "../../../Component/LearningPath.tsx";
import CourseInfo from "./CourseInfo.tsx";
import { useTheme } from "../../../../context/themeContext.js";
import type { TabsProps } from "antd";
import { useUserContext } from "../../context/userContext.tsx";

const enum ViewMode {
  Learning = "learning",
  Info = "info",
}

export default function CoursePage() {
  const user = useUserContext();
  const { slug } = useParams<{ slug: string }>();
  const query = new URLSearchParams(window.location.search);
  console.log(query);
  const LearningQuery = query.get("learning");
  console.log(LearningQuery);
  const [course, setCourse] = useState<ElearningCourseGet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (LearningQuery as ViewMode) || ViewMode.Info
  );

  const [isEnrolled, setIsEnrolled] = useState(false);
  const { isDark } = useTheme();
  const [modal, modalContextHolder] = Modal.useModal();

  const [selectLessonsData, setSelectLessonsData] = useState<ElearningLessons | null>(null);

  {
    /* Learning Path 
    a. module title -> list of lessons in module sort by order
    b. module title display only title but lessons will clckable to content
    c. user be able to click a lessons that passed or in-progress only
  */
  }

  // Note: viewMode will be decided after fetching course (see fetchCourse)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseAndEnrollStatusBySlug(slug, {
          id: user.id,
        }); // TODOS continue update store procedures to get a field user enroll status
        console.log(data);
        setCourse(data);
        setIsEnrolled(data.is_enrolled);
        // Decide view mode after we know enrollment status.
        if (LearningQuery === "true") {
          setViewMode(data.is_enrolled ? ViewMode.Learning : ViewMode.Info);
        }
      } catch (error) {
        console.log(error);
        // if error is not found set not found
        if (error.status === 404) {
          setNotFound(true);
        } else {
          setError("Failed to fetch course");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!slug && user) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchCourse();
  }, [slug]);

  if (loading)
    return (
      <App>
        {modalContextHolder}
        <div className={`${isDark ? "text-zinc-100" : "text-gray-900"}`}>
          Loading...
        </div>
      </App>
    );
  if (error)
    return (
      <App>
        {modalContextHolder}
        <div className={`${isDark ? "text-red-400" : "text-red-600"}`}>
          {error}
        </div>
      </App>
    );
  if (notFound) return <NoMatch />;

  return (
    <App>
      {modalContextHolder}
      <div
        className={`p-4 sm:p-6 rounded-xl shadow transition-colors duration-200 ${
          isDark
        ? "bg-zinc-700 shadow-zinc-900/25"
        : "bg-white shadow-gray-200/50"
        }`}
        style={{ minHeight: "calc(100vh - 110px)" }}
      >
        {viewMode === ViewMode.Learning ? (
          <div className="flex flex-col lg:flex-row">
            <div className={`min-h-[500px] w-full lg:basis-5/6 `}>
              klgtjhfgkl
              {/* <CourseContent
                course={course}
                isDark={isDark}
                isEnrolled={isEnrolled}
              /> */}
            </div>
            <div
              className={`w-full lg:basis-1/6 rounded-xl shadow-lg border ${
                isDark ? "border-zinc-700" : "border-gray-200"
              } lg:ml-6 ml-0 lg:mt-0 mt-4 p-4 flex flex-col gap-4 ${
                isDark ? "bg-zinc-800 text-zinc-100" : "bg-gray-100 text-gray-900"
              }`}
              style={{
                minHeight: "calc(100vh - 150px)",
                overflowY: "auto",
              }}
            >
              <LearningPath
                modulesRaw={(course as any)?.modules ?? []}
                isDark={isDark}
                interactive={true}
                onLessonSelect={(mi, li, lesson) => {
                  setSelectLessonsData(lesson as any);
                  console.log(lesson);
                }}
              />
            </div>
          </div>
        ) : (
          <CourseInfo
        course={course}
        isDark={isDark}
        isEnrolled={isEnrolled}
        onEnroll={() => {
          modal.confirm({
            title: "ยืนยันการลงทะเบียน",
            content: "คุณต้องการลงทะเบียนเรียนหลักสูตรนี้?",
            okText: "ลงทะเบียน",
            cancelText: "ยกเลิก",
            onOk: async () => {
          try {
            if (!course?.id) throw new Error("Invalid course id");
            await enrollCourses(course.id, user.id);
            message.success("ลงทะเบียนเรียบร้อย");
            setIsEnrolled(true);
            setViewMode(ViewMode.Learning);
          } catch (err) {
            console.error(err);
            message.error("การลงทะเบียนล้มเหลว");
          }
            },
          });
        }}
        onContinue={() => setViewMode(ViewMode.Learning)}
  onLessonSelect={(mi, li, lesson) => setSelectLessonsData(lesson)}
          />
        )}
      </div>
    </App>
  );
}
