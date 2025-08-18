import React, { useEffect, useState, Suspense } from "react";
import { Card, Typography, Skeleton } from 'antd';
import { useParams, useLocation } from "react-router-dom";
import { useTheme } from "../../context/themeContext.js";
import NoMatch from "../App/no-match.js";
import { getPageBySlug } from "../../api/pages.ts";
import { getPostBySlug } from "../../api/posts.ts";
const PageCreator = React.lazy(() => import(/* webpackChunkName: "editor" */ "./PageCreator.tsx"));
import { EditorMode } from "../enum.ts";

const { Text } = Typography;

interface EditorViewerProps {
  SlugProps: string | null;
}


export default function EditorViewer({ SlugProps }: EditorViewerProps) {
  const { slug } = useParams();
  const { isDark } = useTheme();
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Removed spinner styles - now using Tailwind's animate-spin

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      if (!slug && !SlugProps) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {// if current route is /pages/:slug getPageByslug, if current route is /posts/:slug getPostBySlug
        let data = null;
        if (location.pathname === `/post/${slug}`) {
          data = await getPostBySlug(slug);
        } else {
          data = await getPageBySlug(slug ? slug : SlugProps);
        }

        setPage(data);

        if (data.is_active < 1) {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, SlugProps]);

  if (notFound) {
    return <NoMatch />;
  }

  if (loading || !page) {
    return (
      <div className="p-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Page Content Loading State */}
          <div className="mb-6 relative opacity-80">
            <div className={`rounded-xl flex items-center justify-center ${
              isDark ? 'border border-gray-600' : 'border border-gray-200'
            }`}>
              <div className="text-center py-12">
                <div className={`w-12 h-12 rounded-full mx-auto mb-4 animate-spin ${
                  isDark 
                    ? 'border-4 border-gray-600 border-t-blue-500' 
                    : 'border-4 border-gray-200 border-t-blue-500'
                }`}></div>
                <Text className={`text-base font-medium ${
                  isDark ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Loading page content...
                </Text>
              </div>
            </div>
          </div>

          {/* Page Info Footer Loading State */}
          <Card
            className={`mt-6 rounded-xl opacity-80 transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-600 shadow-lg' 
                : 'bg-white border-gray-200 shadow-md'
            }`}
            styles={{ body: { padding: '16px' } }}
          >
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <Skeleton.Input 
                  active 
                  className="w-30 h-5"
                />
              </div>
              <div className="flex gap-6 flex-wrap">
                <Skeleton.Input 
                  active 
                  className="w-24 h-4" 
                />
                <Skeleton.Input 
                  active 
                  className="w-24 h-4" 
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 ml-4 ${SlugProps ? 'hidden' : ''}`}>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2
                className={`text-4xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {page.title}
              </h2>
              
              <p className="text-gray-500 text-xs inline-block align-bottom">
                วันที่: {new Date(page.updated_at).toLocaleDateString()}
              </p>
            </div>
            {/* Categories */}
            {page.categories && page.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {page.categories.map((category) => (
                  <span
                    key={category.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Page Content */}
        <div
          className={`rounded-xl ${
            SlugProps 
              ? "" 
              : isDark 
                ? "border-2 border-gray-600 bg-gray-800 shadow-[0_4px_16px_rgba(0,0,0,0.3)]" 
                : "border-2 border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          }`}
        >
          <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
            <PageCreator
              mode={EditorMode.ReadOnly}
              content={page.content}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}