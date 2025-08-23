import React, { useState, useEffect, useMemo } from "react";
import { Input, Select, Button, Card, Tag, Pagination } from "antd";
import { SearchOutlined, ClearOutlined, CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../../context/themeContext.js";
import { fetchAllPosts, fetchAllPostsCategory } from "../../../../api/posts.ts";
import { PostsData } from "../../Interfaces/interface.ts";
import dayjs from "dayjs";
import NewspaperIcon from '@mui/icons-material/Newspaper';

const { Search } = Input;
const { Option } = Select;

interface Category {
  id: string;
  name: string;
}

export default function PostsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // State
  const [posts, setPosts] = useState<PostsData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);


  // TODOS use filter and pagination on db side

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsData, categoriesData] = await Promise.all([
          fetchAllPosts(true, 300, null),
          fetchAllPostsCategory()
        ]);

        setPosts(postsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter posts based on search criteria
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search term filter
      const matchesSearch = searchTerm === "" || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.some(categoryId => 
          post.category && post.category.split(',').includes(categoryId)
        );

      // Date filter
      const postDate = dayjs(post.created_at);
      const matchesYear = selectedYear === null || postDate.year() === selectedYear;
      const matchesMonth = selectedMonth === null || postDate.month() + 1 === selectedMonth;

      return matchesSearch && matchesCategory && matchesYear && matchesMonth;
    });
  }, [posts, searchTerm, selectedCategories, selectedYear, selectedMonth]);

  // Paginated posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPosts.slice(startIndex, startIndex + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedYear(null);
    setSelectedMonth(null);
    setCurrentPage(1);
  };

  // Generate year options (last 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = dayjs().year();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // Month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedYear, selectedMonth]);

  // Render post list item
  const renderPostItem = (post: PostsData) => (
    <div
      key={post.id || post.slug}
      className={`p-6 border-b transition-colors hover:${
        isDark ? "bg-zinc-600/50" : "bg-gray-50"
      } ${isDark ? "border-zinc-600" : "border-gray-200"}`}
      onClick={() => navigate(`/post/${post.slug}`)}
    >
      <div className="flex items-start space-x-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <h1
                className={`text-xl font-medium mb-1 ${
                  isDark ? "text-zinc-200" : "text-gray-900"
                } cursor-pointer hover:text-blue-600 transition-colors`}
                onClick={() => navigate(`/post/${post.slug}`)}
              >
                {post.title}
              </h1>

              {/* Subtitle/Description */}
              <p
                className={`text-sm mb-3 hidden ${
                  isDark ? "text-zinc-400" : "text-gray-600"
                }`}
              >
                {post.content?.length > 150 
                  ? `${post.content.substring(0, 150)}...` 
                  : post.content || "ไม่มีคำอธิบาย"}
              </p>

              {/* Categories from post.category string format */}
              <div className="flex flex-wrap mt-1 mb-3">
                {post.category ? (
                  post.category.split(',').map((categoryId) => (
                    <Tag key={categoryId.trim()} className="text-xs">
                      {getCategoryName(categoryId.trim())}
                    </Tag>
                  ))
                ) : (
                  <span className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    ไม่มีหมวดหมู่
                  </span>
                )}
              </div>

              {/* Meta information */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CalendarOutlined className={isDark ? "text-zinc-400" : "text-gray-500"} />
                  <span className={isDark ? "text-zinc-400" : "text-gray-500"}>
                    {dayjs(post.created_at).format("DD MMM YYYY")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image Placeholder */}
        <div className="flex-shrink-0 ml-4 w-32 sm:w-40 md:w-56 lg:w-72 xl:w-120">
          <div
            className={`relative rounded-lg overflow-hidden flex items-center justify-center w-full aspect-video ${
              isDark ? "bg-zinc-600" : "bg-zinc-800"
            }`}
          >
            {post.cover_image_url ? (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover rounded-lg drag-none"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="p-4 rounded-lg flex items-center justify-center">
                  <NewspaperIcon style={{ fontSize: "48px", color: isDark ? "white" : "gray" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      backgroundColor: isDark ? '#27272a' : '#f5f5f5', 
      minHeight: '100vh',
      padding: '24px',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="select-none" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2
              className={`text-3xl font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
              style={{ fontFamily: "Kanit, sans-serif" }}
            >
              โพสต์ทั้งหมด
            </h2>
            <p
              className="text-gray-500 text-sm"
              style={{ fontFamily: "Kanit, sans-serif" }}
            >
              
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card
          className={`mb-6}`}
          styles={{ body: { padding: "24px" } }}
        >
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <Search
                placeholder="ค้นหาโพสต์..."
                allowClear
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={setSearchTerm}
                    className={`theme-search-input`}
                    prefix={<SearchOutlined className={`transition-colors ${
                      isDark ? 'text-zinc-500' : 'text-gray-400'
                    }`} />}
                    aria-label="Search courses"
                    style={{
                      backgroundColor: 'var(--search-bg)',
                      borderColor: 'var(--search-border)',
                      borderRadius: '12px 0 0 12px',
                    }}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-zinc-300" : "text-gray-700"
                }`}>
                  หมวดหมู่
                </label>
                <Select
                  mode="multiple"
                  placeholder="เลือกหมวดหมู่"
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  className="w-full"
                  allowClear
                >
                  {categories.map((category) => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-zinc-300" : "text-gray-700"
                }`}>
                  ปี
                </label>
                <Select
                  placeholder="เลือกปี"
                  value={selectedYear}
                  onChange={setSelectedYear}
                  className="w-full"
                  allowClear
                >
                  {yearOptions.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-zinc-300" : "text-gray-700"
                }`}>
                  เดือน
                </label>
                <Select
                  placeholder="เลือกเดือน"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  className="w-full"
                  allowClear
                >
                  {monthOptions.map((month) => (
                    <Option key={month.value} value={month.value}>
                      {month.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearFilters}
                  className="w-full"
                >
                  ล้างตัวกรอง
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-600">
              <span className={`text-sm ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                แสดง {filteredPosts.length} จาก {posts.length} โพสต์
              </span>
              {(searchTerm || selectedCategories.length > 0 || selectedYear || selectedMonth) && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Tag closable onClose={() => setSearchTerm("")}>
                      ค้นหา: {searchTerm}
                    </Tag>
                  )}
                  {selectedCategories.map((categoryId) => (
                    <Tag
                      key={categoryId}
                      closable
                      onClose={() => setSelectedCategories(prev => prev.filter(id => id !== categoryId))}
                    >
                      {getCategoryName(categoryId)}
                    </Tag>
                  ))}
                  {selectedYear && (
                    <Tag closable onClose={() => setSelectedYear(null)}>
                      ปี: {selectedYear + 543}
                    </Tag>
                  )}
                  {selectedMonth && (
                    <Tag closable onClose={() => setSelectedMonth(null)}>
                      เดือน: {monthOptions.find(m => m.value === selectedMonth)?.label}
                    </Tag>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Posts List */}
        <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow overflow-hidden mt-8`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-600"}`}>กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center">
                <p className={`text-lg font-medium ${isDark ? "text-zinc-200" : "text-gray-600"} mb-2`}>
                  ไม่พบโพสต์
                </p>
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                  ไม่มีโพสต์ที่ตรงกับเงื่อนไขการค้นหา
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Posts List */}
              <div className="divide-y divide-gray-200 dark:divide-zinc-600">
                {paginatedPosts.map((post) => renderPostItem(post))}
              </div>

              {/* Pagination */}
              {filteredPosts.length > pageSize && (
                <div className={`px-6 py-4 border-t ${isDark ? "border-zinc-600 bg-zinc-700" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-700"}`}>
                      แสดง {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredPosts.length)} จาก {filteredPosts.length} รายการ
                    </div>
                    <Pagination
                      current={currentPage}
                      total={filteredPosts.length}
                      pageSize={pageSize}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      className={isDark ? "dark-pagination" : ""}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}