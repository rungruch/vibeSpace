import React, { useMemo, useState } from "react";
import { useTheme } from "../../context/themeContext.js";

export interface PaginatedListProps<T> {
  items: T[];
  isLoading: boolean;
  pageSize?: number;
  emptyTitle: string;
  emptyDescription?: string;
  rowKey: (item: T) => string;
  renderDesktopHeader: React.ReactNode; // should be a <tr>...</tr>
  renderDesktopRow: (item: T) => React.ReactNode; // should be a <tr>...</tr>
  renderMobileCard: (item: T) => React.ReactNode; // should be a <div>...</div>
}

function PaginatedList<T>(props: PaginatedListProps<T>) {
  const { isDark } = useTheme();
  const {
    items,
    isLoading,
    pageSize = 10,
    emptyTitle,
    emptyDescription,
    rowKey,
    renderDesktopHeader,
    renderDesktopRow,
    renderMobileCard,
  } = props;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize]
  );

  // Reset to first page if items change and current page goes out of range
  React.useEffect(() => {
    const newTotal = Math.ceil(items.length / pageSize) || 1;
    if (currentPage > newTotal) setCurrentPage(1);
  }, [items, pageSize, currentPage]);

  return (
    <div className={`${isDark ? "bg-zinc-700" : "bg-white"} rounded-lg shadow overflow-hidden`}>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-600"}`}>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <p className={`text-lg font-medium ${isDark ? "text-zinc-200" : "text-gray-600"} mb-2`}>{emptyTitle}</p>
            {emptyDescription ? (
              <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{emptyDescription}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block min-h-[400px] max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
              <thead className={isDark ? "bg-zinc-800" : "bg-gray-50"}>{renderDesktopHeader}</thead>
              <tbody className={`divide-y ${isDark ? "divide-zinc-600" : "divide-gray-200"}`}>
                {paginatedItems.map((item) => (
                  <React.Fragment key={rowKey(item)}>{renderDesktopRow(item)}</React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-zinc-600 max-h-[600px] overflow-y-auto">
            {paginatedItems.map((item) => (
              <div key={rowKey(item)} className="p-4">
                {renderMobileCard(item)}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-3 border-t ${isDark ? "border-zinc-600 bg-zinc-700" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDark ? "text-zinc-200" : "text-gray-700"}`}>
                  แสดง {startIndex + 1}-{Math.min(startIndex + pageSize, items.length)} จาก {items.length} รายการ
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100 dark:hover:bg-zinc-500"
                    } ${isDark ? "border-zinc-500 text-zinc-200" : "border-gray-300 text-gray-700"}`}
                  >
                    ก่อนหน้า
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white border-blue-600"
                          : isDark
                          ? "border-zinc-500 text-zinc-200 hover:bg-zinc-500"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100 dark:hover:bg-zinc-500"
                    } ${isDark ? "border-zinc-500 text-zinc-200" : "border-gray-300 text-gray-700"}`}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PaginatedList;
