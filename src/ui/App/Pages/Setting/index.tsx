// settings menus, current user settings and admin menus : My Account, Users and Permission, Courses, Pages, Posts, Announcements, Files,
import React, { useState } from "react";
import PagesListCustom from "../../../Component/PageSetting.tsx";
import PostsList from "../Post/list/index.tsx";
import { useTheme } from "../../../../context/themeContext.js";
import FileExplorerPage from "../File/list/index.tsx";
import SettingsMainPage from "../../../Component/MainSettings.tsx";

// Settings menu items
const SETTINGS_MENUS = [
  { id: "account", label: "My Account" },
  { id: "users", label: "Users and Permission" },
  { id: "courses", label: "Courses" },
  { id: "pages", label: "Pages" },
  { id: "posts", label: "Posts" },
  { id: "main", label:"Home" },
  { id: "announcements", label: "Announcements" },
  { id: "files", label: "Files" },
];

// Individual setting components
const MyAccountSettings = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">My Account</h2>
    <p className="text-gray-600">
      Manage your account settings and profile information.
    </p>
    {/* Add account settings form here */}
  </div>
);

const UsersPermissionSettings = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Users and Permission</h2>
    <p className="text-gray-600">Manage user accounts and permissions.</p>
    {/* Add users and permission management here */}
  </div>
);

const CoursesSettings = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Courses</h2>
    <p className="text-gray-600">Manage course settings and configurations.</p>
    {/* Add courses settings here */}
  </div>
);


const AnnouncementsSettings = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Announcements</h2>
    <p className="text-gray-600">Manage announcements and notifications.</p>
    {/* Add announcements settings here */}
  </div>
);

const SettingsPage = () => {
  const [activeMenu, setActiveMenu] = useState("account");
  const { isDark } = useTheme();

  const renderActiveComponent = () => {
    switch (activeMenu) {
      case "account":
        return <UsersPermissionSettings />;
      case "users":
        return <UsersPermissionSettings />;
      case "courses":
        return <CoursesSettings />;
      case "pages":
        return <PagesListCustom />;
      case "posts":
        return <PostsList />;
      case "announcements":
        return <AnnouncementsSettings />;
      case "files":
        return <FileExplorerPage />;
      case "main":
        return <SettingsMainPage />;
      default:
        return <MyAccountSettings />;
    }
  };

  return (
      <div
        className={`min-h-screen p-6 transition-colors duration-300 rounded-lg ${
          isDark ? "bg-zinc-800" : "bg-gray-100"
        }`}
      >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2
              className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            ตั้งค่า
          </h2>
          <p
              className={`text-lg transition-colors duration-300 ${
                isDark ? "text-gray-300" : "text-gray-500"
              }`}
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            จัดการบัญชีและตั้งค่า
          </p>
        </div>
      </div>

      {/* Horizontal Navigation Bar */}
        <div
          className={`rounded-xl shadow-sm transition-colors duration-300 ${
            isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
          } border`}
        >
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto justify-center text-center">
            {SETTINGS_MENUS.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(menu.id)}
                className={`
                  whitespace-nowrap px-5 py-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeMenu === menu.id
                        ? isDark
                          ? "bg-blue-600 text-white rounded-full shadow"
                          : "bg-blue-600 text-white rounded-full shadow"
                        : isDark
                          ? "bg-transparent text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-full"
                          : "bg-transparent text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                  }
                  mx-1
                `}
                style={{
                  border: "none",
                  outline: "none",
                }}
              >
                {menu.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
        <div className="w-full px-0 py-8">
          <div
            className={`rounded-lg shadow transition-colors duration-300 ${
              isDark ? "bg-zinc-900" : "bg-white"
            }`}
          >
            {renderActiveComponent()}
          </div>
        </div>
    </div>
  );
};

export default SettingsPage;
