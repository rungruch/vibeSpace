import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, LinkOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Modal, message } from "antd";
import { useTheme } from "../../../../../context/themeContext.js";
import { fetchAllPosts, deletePostById } from "../../../../../api/posts.ts";
import PaginatedList from "../../../../Component/PaginatedList.tsx";

// form interface for component use
interface TransformedPost {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

const PostsList: React.FC = () => {
  const { isDark } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all posts data from API
  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true);
        const data = await fetchAllPosts(false, null, null);
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Transform API data to component format
  const transformedPosts: TransformedPost[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.is_active ? "Active" : "Draft",
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    slug: post.slug,
  }));

  // Filter posts based on search and filters
  const filteredPosts = transformedPosts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination handled by PaginatedList

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "Draft":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-600 dark:text-zinc-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Active":
        return "เผยแพร่";
      case "Draft":
        return "ร่าง";
      default:
        return status;
    }
  };

  async function handleDeletePost(id: string): Promise<void> {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: "คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?",
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          setIsLoading(true);
          await deletePostById(id);
          setPosts((prev) => prev.filter((post) => post.id !== id));
          message.success("ลบโพสต์เรียบร้อยแล้ว");
        } catch (error) {
          message.error("เกิดข้อผิดพลาดในการลบโพสต์");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: "Kanit, sans-serif" }}>
            จัดการโพสต์
          </h2>
          <p className="text-gray-500 text-lg" style={{ fontFamily: "Kanit, sans-serif" }}>
            รายการโพสต์ทั้งหมด
          </p>
        </div>
        <Link
          to="/post/create"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-medium rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40 backdrop-blur-xl border border-blue-400/20 hover:border-blue-300/30 transform hover:scale-105 active:scale-95"
          style={{
            fontFamily: "Kanit, sans-serif",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 1))",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <PlusOutlined />
          <span className="ml-2">สร้างโพสต์ใหม่</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow p-6 text-center`}>
          <div className="text-3xl font-bold text-blue-600 mb-2">{transformedPosts.length}</div>
          <div className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-500"}`}>โพสต์ทั้งหมด</div>
        </div>
        <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow p-6 text-center`}>
          <div className="text-3xl font-bold text-green-600 mb-2">{transformedPosts.filter((p) => p.status === "Active").length}</div>
          <div className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-500"}`}>โพสต์ที่เผยแพร่</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow p-4 mb-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="ค้นหาเพจ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? "bg-zinc-600 border-zinc-500 text-white placeholder-zinc-300" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchOutlined />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? "bg-zinc-600 border-zinc-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            <option value="All">สถานะทั้งหมด</option>
            <option value="Active">เผยแพร่</option>
            <option value="Draft">ร่าง</option>
          </select>
        </div>
      </div>

      {/* Posts Table (Reusable) */}
      <PaginatedList
        items={filteredPosts}
        isLoading={isLoading}
        pageSize={10}
        emptyTitle="ไม่พบโพสต์"
        emptyDescription="คุณยังไม่มีโพสต์ใดๆ เริ่มต้นสร้างโพสต์แรกของคุณ"
        rowKey={(post) => post.id}
        renderDesktopHeader={
          <tr>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-gray-500"}`}>ชื่อเพจ</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-gray-500"}`}>slug</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-gray-500"}`}>สถานะ</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-gray-500"}`}>วันที่สร้าง</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-gray-500"}`}>การดำเนินการ</th>
          </tr>
        }
        renderDesktopRow={(post) => (
          <tr key={post.id} className={isDark ? "hover:bg-zinc-600" : "hover:bg-gray-50"}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className={`text-sm font-medium ${isDark ? "text-zinc-100" : "text-gray-900"}`}>{post.title}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className={`text-sm font-medium ${isDark ? "text-zinc-100" : "text-gray-900"}`}>{post.slug}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(post.status)}`}>{getStatusText(post.status)}</span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? "text-zinc-100" : "text-gray-900"}`}>{new Date(post.createdAt).toLocaleDateString("th-TH")}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  className={`p-2 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                  title="แชร์ลิงก์"
                  onClick={() => {
                    const url = `${window.location.origin}/post/${post.slug}`;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(url);
                      message.success("คัดลอกลิงก์โพสต์แล้ว");
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = url;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      message.success("คัดลอกลิงก์เพจแล้ว");
                    }
                  }}
                >
                  <LinkOutlined />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                  title="ดูโพสต์"
                  onClick={() => navigate(`/post/${post.slug}`)}
                >
                  <EyeOutlined />
                </button>
                <button
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                  title="แก้ไข"
                  onClick={() => navigate(`/post/edit/${post.id}`)}
                >
                  <EditOutlined />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                  title="ลบ"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <DeleteOutlined />
                </button>
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(post) => (
          <>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${isDark ? "text-zinc-100" : "text-gray-900"}`}>{post.title}</h3>
                <p className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-600"}`}>{post.slug}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(post.status)}`}>{getStatusText(post.status)}</span>
            </div>
            <div className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-600"} mb-3`}>
              <div>วันที่สร้าง: {new Date(post.createdAt).toLocaleDateString("th-TH")}</div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                title="แชร์ลิงก์"
                onClick={() => {
                  const url = `${window.location.origin}/post/${post.slug}`;
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url);
                    message.success("คัดลอกลิงก์โพสต์แล้ว");
                  } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    message.success("คัดลอกลิงก์เพจแล้ว");
                  }
                }}
              >
                <LinkOutlined />
              </button>
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                title="ดูโพสต์"
                onClick={() => navigate(`/post/${post.slug}`)}
              >
                <EyeOutlined />
              </button>
              <button
                className={`p-2 rounded hover:bg-gray-100 ${isDark ? "hover:bg-zinc-500 text-zinc-200" : "text-gray-500"}`}
                title="แก้ไข"
                onClick={() => navigate(`/post/edit/${post.id}`)}
              >
                <EditOutlined />
              </button>
              <button
                className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                title="ลบ"
                onClick={() => handleDeletePost(post.id)}
              >
                <DeleteOutlined />
              </button>
            </div>
          </>
        )}
      />
    </div>
  );
};

export default PostsList;
