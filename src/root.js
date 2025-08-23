import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { ConfigProvider, App } from "antd";
import enUS from "antd/locale/en_US";
import HomePage from "./ui/App/Pages/Home/index.tsx";

// Lazy Components
const Header = lazy(() => import("./ui/App/header.tsx"));
const Sidebar = lazy(() => import("./ui/App/sidebar.tsx"));
const NoMatch = lazy(() => import("./ui/App/no-match"));
const Survey = lazy(() => import("./ui/App/Pages/Form/Form.tsx"));
const FormCreatorApp = lazy(() =>
  import("./ui/App/Pages/Form/create/index.tsx")
);
const FormsListCustom = lazy(() =>
  import("./ui/App/Pages/Form/FormsListCustom.tsx")
);
const PageCreate = lazy(() => import("./ui/App/Pages/Page/create/index.tsx"));
const FormEditorApp = lazy(() => import("./ui/App/Pages/Form/edit/index.tsx"));
const FormResponses = lazy(() =>
  import("./ui/App/Pages/Form/responses/formResponses.tsx")
);
const FilePage = lazy(() => import("./ui/App/Pages/File/list/index.tsx"));
const SettingsPage = lazy(() => import("./ui/App/Pages/Setting/index.tsx"));
const PageEdit = lazy(() => import("./ui/App/Pages/Page/edit/index.tsx"));
const PostCreate = lazy(() => import("./ui/App/Pages/Post/create/index.tsx"));
const EditorViewer = lazy(() => import("./ui/Component/EditorViewer.tsx"));
const PostPage = lazy(() => import("./ui/App/Pages/Post/index.tsx"));
const CourseCreate = lazy(() =>
  import("./ui/App/Pages/Elearning/create/index.tsx")
);
const CoursePage = lazy(() => import("./ui/App/Pages/Elearning/index.tsx"));

// Context
import { UserContextProvider } from "./ui/App/context/userContext.tsx";
import {
  AppStateProvider,
  AppWrapper,
} from "./ui/App/context/appStateContext.tsx";
import { ThemeProvider, useTheme } from "./context/themeContext.js";

// Styles
import "@ant-design/v5-patch-for-react-19";
import "./default.css";
import "./theme.scss";

// Custom hook for responsive design
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile };
};

// Main app routes component
const AppRoutes = () => {
  const { isMobile } = useResponsive();
  const { isDark } = useTheme();
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isMobile ? "px-4" : "px-8"
      } ${isDark ? "bg-zinc-800 text-zinc-100" : "bg-gray-100 text-gray-900"}`}
      style={{
        marginLeft: isMobile ? "0px" : "calc(var(--sidebar-width, 304px))",
        minHeight: "calc(100vh - 96px)",
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
        paddingTop: isMobile ? "1rem" : "2rem",
      }}
    >
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<PostPage />} />
            <Route path="/forms" element={<FormsListCustom />} />
            <Route path="/form/create" element={<FormCreatorApp />} />
            <Route path="/form/edit/:id" element={<FormEditorApp />} />
            <Route path="/form/responses/:id" element={<FormResponses />} />
            <Route path="/form" element={<Survey />} />
            <Route path="/page/create" element={<PageCreate />} />
            <Route path="/page/edit/:id" element={<PageEdit />} />
            <Route path="/post/create" element={<PostCreate />} />
            <Route path="/post/edit/:id" element={<PostCreate />} />
            <Route path="/file" element={<FilePage />} />
            <Route path="/page/:slug" element={<EditorViewer />} />
            <Route path="/post/:slug" element={<EditorViewer />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/course/:slug" element={<CoursePage />} />
            <Route path="/course/create" element={<CourseCreate />} />
            {/* <Route path="/course/edit/:id" element={<CourseCreate />} />
            <Route path="/course/manage" element={<CourseManage />} />
            <Route path="/courses" element={<CourseList />} /> */}

            <Route path="*" element={<NoMatch />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// Simplified main app component
const Main = () => {
  const { theme, getAntdTheme, isDark } = useTheme();
  return (
    <ConfigProvider theme={getAntdTheme()} locale={enUS}>
        <AppWrapper>
          <div
            className={`subpixel-antialiased transition-colors duration-300 ${
              isDark ? "bg-zinc-800 text-white" : "bg-gray-100 text-gray-900"
            }`}
            style={{ minHeight: "100vh" }}
          >
            <Header />
            <Sidebar />
            <AppRoutes />
          </div>
        </AppWrapper>
    </ConfigProvider>
  );
};

export default function Root() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={`/${process.env.BASE_NAME}`}>
        <CookiesProvider>
          <AppStateProvider>
            <UserContextProvider>
              <Main />
            </UserContextProvider>
          </AppStateProvider>
        </CookiesProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
