import React from "react";
import { Button, Tag, Tabs } from "antd";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import GradeIcon from "@mui/icons-material/Grade";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LearningPath from "../../../Component/LearningPath.tsx";
import type { ElearningCourseGet } from "../../Interfaces/elearning.ts";

interface Props {
  course: ElearningCourseGet | null;
  isDark: boolean;
  isEnrolled: boolean;
  onEnroll: () => void;
  onContinue: () => void;
  onLessonSelect?: (moduleIndex: number, lessonIndex: number, lesson: any) => void;
}

export default function CourseInfo({ course, isDark, isEnrolled, onEnroll, onContinue, onLessonSelect }: Props) {
  const courseTabsItems = [
    {
      key: "1",
      label: "รายละเอียดหลักสูตร",
      children: (
        <div className="ml-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold">วัตถุประสงค์</h2>
            <p
              className={`ml-4 text-sm sm:text-base leading-relaxed mb-6 transition-colors duration-200 ${
                isDark ? "text-zinc-300" : "text-gray-600"
              }`}
            >
              {course?.objective}
            </p>
          </div>
          <div className="mb-2">
            <h2 className="text-lg font-semibold">ผู้สอน</h2>
            {/* TODOS mapping teacher name from permission list*/}
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: "เส้นทางการเรียนรู้",
      children: (
        <div className="ml-2">
          <LearningPath modulesRaw={(course as any)?.modules} isDark={isDark} interactive={true} onLessonSelect={onLessonSelect} />
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Main content container - responsive flex layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Image section */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          {course?.cover_image_url ? (
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full lg:w-90 xl:w-120 h-48 sm:h-56 lg:h-64 xl:h-80 object-cover rounded-lg shadow-md"
            />
          ) : (
            <div
              className={`flex items-center justify-center w-full lg:w-90 xl:w-120 h-48 sm:h-56 lg:h-64 xl:h-80 rounded-lg shadow-md transition-colors duration-200 ${
                isDark ? "bg-zinc-700" : "bg-gray-800"
              }`}
            >
              <MenuBookIcon style={{ fontSize: 48, color: "#fff" }} />
            </div>
          )}

          <Button
            type="primary"
            className={`mt-4 w-full lg:w-90 xl:w-120 transition-colors duration-200 ${
              isDark
                ? "bg-zinc-600 border-zinc-600 hover:bg-zinc-500 hover:border-zinc-500"
                : ""
            }`}
            onClick={() => {
              if (isEnrolled) {
                onContinue();
              } else {
                onEnroll();
              }
            }}
          >
            {isEnrolled ? "ดำเนินการเรียนต่อ" : "ลงทะเบียนเรียน"}
          </Button>
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-bold leading-tight transition-colors duration-200 ${
              isDark ? "text-zinc-100" : "text-gray-900"
            }`}
          >
            {course?.title}
          </h1>

          {/* Categories from course.category map name */}
          <div className="flex flex-wrap gap-1 mt-3 mb-4">
            {(() => {
              let categories: { name: string }[] = [];
              if (typeof course?.category === "string") {
                try {
                  categories = JSON.parse(course.category);
                } catch {
                  categories = [];
                }
              } else if (Array.isArray(course?.category)) {
                categories = (course.category as string[]).map((cat) => ({ name: cat }));
              }
              return categories.map((cat) => (
                <Tag
                  key={cat.name.trim()}
                  className={`text-xs sm:text-sm transition-colors duration-200 ${
                    isDark
                      ? "bg-zinc-700 text-zinc-200 border-zinc-600"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {cat.name}
                </Tag>
              ));
            })()}
          </div>

          <h2
            className={`text-base sm:text-lg font-semibold mb-2 transition-colors duration-200 ${
              isDark ? "text-zinc-200" : "text-gray-800"
            }`}
          >
            คำอธิบายหลักสูตร
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed mb-6 transition-colors duration-200 ${
              isDark ? "text-zinc-300" : "text-gray-600"
            }`}
          >
            {course?.description}
          </p>

          {/* Course stats - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div
              className={`flex items-center text-sm sm:text-base p-3 rounded-lg transition-colors duration-200 ${
                isDark
                  ? "text-zinc-200 bg-zinc-700 hover:bg-zinc-600"
                  : "text-gray-700 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <AccessTimeIcon
                className={`mr-2 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
                fontSize="small"
              />
              <span className="font-medium">{course?.duration_minute} นาที</span>
            </div>
            <div
              className={`flex items-center text-sm sm:text-base p-3 rounded-lg transition-colors duration-200 ${
                isDark
                  ? "text-zinc-200 bg-zinc-700 hover:bg-zinc-600"
                  : "text-gray-700 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <LibraryBooksIcon
                className={`mr-2 ${isDark ? "text-teal-400" : "text-teal-600"}`}
                fontSize="small"
              />
              <span className="font-medium">{0} บทเรียน</span>
            </div>
            <div
              className={`flex items-center text-sm sm:text-base p-3 rounded-lg transition-colors duration-200 ${
                isDark
                  ? "text-zinc-200 bg-zinc-700 hover:bg-zinc-600"
                  : "text-gray-700 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <GradeIcon
                className={`mr-2 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                fontSize="small"
              />
              <span className="font-medium">{course?.rating} คะแนน</span>
            </div>
            {course?.certificate && (
              <div
                className={`flex items-center text-sm sm:text-base p-3 rounded-lg transition-colors duration-200 ${
                  isDark
                    ? "text-zinc-200 bg-zinc-700 hover:bg-zinc-600"
                    : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <WorkspacePremiumIcon
                  className={`mr-2 ${isDark ? "text-violet-400" : "text-violet-600"}`}
                  fontSize="small"
                />
                <span className="font-medium">มีใบรับรอง</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {/* Render Course description tab and learning path tabs */}
        <Tabs defaultActiveKey="1" items={courseTabsItems} />
      </div>
    </>
  );
}
