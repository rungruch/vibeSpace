import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Tag, Carousel } from "antd";
import {  CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../../context/themeContext.js";
import { fetchAllPosts, fetchAllPostsCategory } from "../../../../api/posts.ts";
import { PostsData, HeroSectionSettings, MainPageSettings } from "../../../interface.ts";
import dayjs from "dayjs";
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { getSettings } from "../../../../api/setting.ts";
import { SettingsGroup } from "../../../enum.ts";
import EditorViewer from "../../../Component/EditorViewer.tsx";

interface Category {
  id: string;
  name: string;
}

// TODOS Handle fetch Error 
export default function HomePage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // State
  const [posts, setPosts] = useState<PostsData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [herosectionSettings, setHeroSectionSettings] = useState<HeroSectionSettings>();
  const [mainPageSettings, setMainPageSettings] = useState<MainPageSettings>();
  const [selectedNavKey, setSelectedNavKey] = useState<string>('');
  const [selectedNavValue, setSelectedNavValue] = useState<string>('');
  const [slugProps, setSlugProps] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsData, categoriesData] = await Promise.all([
          fetchAllPosts(true, 10, null),
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

    // Fetch files from API
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await getSettings();
        const heroSectionSetting = response.find((item: any) => item.name.trim() === SettingsGroup.HeroSection);
        if (heroSectionSetting && heroSectionSetting.data) {
          setHeroSectionSettings(JSON.parse(heroSectionSetting.data));
        }

        const mainPageSetting = response.find((item: any) => item.name.trim() === SettingsGroup.MainPage);
        if (mainPageSetting && mainPageSetting.data) {
          const mainPageData = JSON.parse(mainPageSetting.data);
            mainPageData.หน้าแรก = [];
          
          setMainPageSettings(mainPageData);

          // Default to 'หน้าแรก' key if it exists, otherwise use first key
          const defaultKey = 'หน้าแรก';
          setSelectedNavKey(defaultKey);

          // If not หน้าแรก, set selectedNavValue and slugProps for the selected key
          if (defaultKey !== 'หน้าแรก' && mainPageData[defaultKey] && mainPageData[defaultKey].length > 0) {
            const firstPageRoute = mainPageData[defaultKey][0].route.split('/').pop();
            setSelectedNavValue(firstPageRoute);
            setSlugProps(firstPageRoute);
          } else {
            // Clear these values when หน้าแรก is selected
            setSelectedNavValue('');
            setSlugProps(null);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchSettings();
    }, []);

  const filteredPosts = useMemo(() => {
    return posts
  }, [posts]);


  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

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
                  <></>
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
        <div className="flex-shrink-0 ml-4 w-32 md:w-32 lg:w-48 xl:w-64">
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
      <div className="select-none" style={{margin: '0 auto' }}>
        {/* Hero Section Carousel */}
        {herosectionSettings && Array.isArray(herosectionSettings.data) && herosectionSettings.data.length > 0 && (
          <div className="mb-8 max-w-5xl mx-auto">
            <Carousel arrows autoplay dots className="rounded-l overflow-hidden">
              {herosectionSettings.data.map((item: any, idx: number) => (
                <div key={idx} className="relative w-full aspect-video">
                  <div className="block w-full h-full cursor-pointer" onClick={() => navigate(item.route)}>
                    <img
                      src={item.img_url}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-l"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white p-4 text-xl font-semibold rounded-b-l">
                      <span className="drop-shadow-lg">{item.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        )}
        
        {/* Double Navigation */}
        {mainPageSettings && (
          <div className="mb-8 max-w-4xl mx-auto">
            {/* First Row - Keys */}
            <div>
              <div
              className={`flex flex-wrap gap-2 p-4 rounded-3xl justify-center mb-3`}
              >
              {Object.keys(mainPageSettings)
                .sort((a, b) => a === 'หน้าแรก' ? -1 : b === 'หน้าแรก' ? 1 : 0) // Ensures 'หน้าแรก' is first
                .map((key) => (
                <button
                  key={key}
                  onClick={() => {
                  setSelectedNavKey(key);

                  // If หน้าแรก is selected, clear the slugProps
                  if (key === 'หน้าแรก') {
                    setSelectedNavValue('');
                    setSlugProps(null);
                  }
                  // Otherwise, set to first page of selected key
                  else if (mainPageSettings[key] && mainPageSettings[key].length > 0) {
                    const firstPageRoute = mainPageSettings[key][0].route.split('/').pop();
                    setSelectedNavValue(firstPageRoute);
                    setSlugProps(firstPageRoute);
                  } else {
                    setSelectedNavValue('');
                  }
                  }}
                  className={`px-6 py-4 rounded ${isDark ? "text-zinc-200" : "text-blue-950"} font-medium text-xl transition-colors relative group`}
                >
                  {key}
                  {(selectedNavKey === key) && (
                  <motion.span
                    layoutId="nav-dot-indicator"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-1 block w-2 h-2 rounded-full bg-sky-900 dark:bg-sky-800 border border-blue-900"
                  />
                  )}
                  {/* Show dot on hover if not selected */}
                  {(selectedNavKey !== key) && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 bottom-1 block w-2 h-2 rounded-full bg-sky-900/50 dark:bg-sky-800/50 border border-blue-900/50 opacity-0 group-hover:opacity-10 transition-opacity"
                  />
                  )}
                </button>
              ))}
              </div>
            </div>
            
            {/* Second Row - Pages List (don't show for 'หน้าแรก') */}
            {selectedNavKey && selectedNavKey !== 'หน้าแรก' && mainPageSettings[selectedNavKey] && (
                <div className={`mb-4 ${isDark ? "bg-zinc-600/50" : "bg-[#c5c7c9]"} rounded-4xl w-fit mx-auto`}>
                <div
                  className={`flex flex-wrap gap-2 rounded-4xl justify-center ${
                  mainPageSettings[selectedNavKey].length > 3 ? 'max-w-3xl' : 'max-w-2xl'
                  }`}
                >
                  {mainPageSettings[selectedNavKey].map((page: any, idx: number) => (
                    <div style={{ position: 'relative', display: 'inline-block' }} key={idx}>
                      {selectedNavValue === page.route.split('/').pop() && (
                        <motion.div
                          layoutId="page-indicator-bg"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                          className={`absolute top-0 left-0 w-full h-full rounded-3xl border shadow-md z-1 ${
                            isDark
                              ? 'bg-zinc-800/50 border-zinc-600'
                              : 'bg-white/60 border-gray-400'
                          }`}
                        />
                      )}
                      <button
                        onClick={() => {
                          const routeValue = page.route.split('/').pop();
                          setSlugProps(routeValue);
                          setSelectedNavValue(routeValue);
                        }}
                        className={`px-10 py-3 text-m rounded font-medium transition-colors rounded-3xl ${
                          selectedNavValue === page.route.split('/').pop()
                            ? ` ${isDark ? "text-zinc-200" : "text-gray-900"}`
                            : ` ${!isDark ? "text-zinc-50 hover:bg-zinc-400/30" : "text-gray-50 hover:bg-white/30"}`
                        }`}
                        style={{ position: 'relative', zIndex: 2, background: 'transparent' }}
                      >
                        {page.title}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show EditorViewer when not on หน้าแรก page */}
        {selectedNavKey !== 'หน้าแรก' && selectedNavKey && (
          <EditorViewer SlugProps={slugProps} />
        )}

        {/* Posts List - only show when หน้าแรก is selected */}
        {selectedNavKey === 'หน้าแรก' && (
          <div className="flex justify-center">
            <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow overflow-hidden mt-8 max-w-5xl w-full`}>
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
                    {filteredPosts.slice(0, 10).map((post) => renderPostItem(post))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}