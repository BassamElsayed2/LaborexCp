"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define a generic type for sheet rows
interface SheetRow {
  [key: string]: string | number | boolean | null;
}

export default function ExcelFilesList() {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SheetRow[] | null>(null);
  const [previewName, setPreviewName] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;
  const [search, setSearch] = useState("");

  // Share: open WhatsApp Web with file link, let user pick contact
  const handleShare = (fileName: string) => {
    const previewUrl = `${
      window.location.origin
    }/dashboard/sheets/view/${encodeURIComponent(fileName)}`;
    const msg = encodeURIComponent(`رابط الملف للعرض فقط: ${previewUrl}`);
    const waUrl = `https://wa.me/?text=${msg}`;
    window.open(waUrl, "_blank");
    toast.custom((t) => (
      <span className="flex flex-col items-start gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow border border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-800 dark:text-gray-100 mb-1">
          رابط العرض:
        </span>
        <span className="text-xs break-all text-blue-700 dark:text-blue-300 mb-2">
          {previewUrl}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(previewUrl);
            toast.success("تم نسخ الرابط!");
            toast.dismiss(t.id);
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        >
          نسخ الرابط
        </button>
      </span>
    ));
  };

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("sheets").list("", {
      limit: 100,
    });

    if (error) {
      console.error("خطأ في تحميل الملفات:", error.message);
      setLoading(false);
      return;
    }

    const filesWithUrls = data?.map((file) => {
      const { data: publicUrl } = supabase.storage
        .from("sheets")
        .getPublicUrl(file.name);
      return {
        name: file.name,
        url: publicUrl.publicUrl,
      };
    });

    setFiles(filesWithUrls);
    setLoading(false);
  };

  const handleDelete = async (fileName: string) => {
    toast((t) => (
      <span>
        هل أنت متأكد من حذف الملف؟
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            const { error } = await supabase.storage
              .from("sheets")
              .remove([fileName]);
            if (error) {
              toast.error("فشل حذف الملف: " + error.message);
            } else {
              setFiles((prev) => prev.filter((f) => f.name !== fileName));
              if (fileName === previewName) {
                setPreviewData(null);
                setPreviewName("");
              }
              toast.success("تم حذف الملف بنجاح");
            }
          }}
          className="ml-2 mr-2 px-2 py-1 bg-red-500 text-white rounded"
        >
          نعم
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-2 py-1 bg-gray-300 rounded"
        >
          إلغاء
        </button>
      </span>
    ));
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("تم بدء تحميل الملف");
    } catch {
      toast.error("فشل تحميل الملف");
    }
  };

  const handlePreview = async (url: string, name: string) => {
    setLoading(true);
    setPreviewData(null);
    setPreviewName(name);

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const wb = XLSX.read(arrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<SheetRow>(ws);
      setPreviewData(json);
      // Scroll to preview after data is set (slight delay to ensure render)
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (err) {
      console.error("خطأ في قراءة الملف:", err);
      toast.error("تعذر عرض الملف.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Sort files by timestamp in filename (newest to oldest)
  const sortedFiles = [...files].sort((a, b) => {
    const aTs = parseInt(a.name.split("_")[0], 10);
    const bTs = parseInt(b.name.split("_")[0], 10);
    return bTs - aTs;
  });
  // Filter files by search (ignoring timestamp prefix)
  const filteredFiles = sortedFiles.filter((file) => {
    const displayName = file.name.split("_").slice(1).join("_").toLowerCase();
    return displayName.includes(search.toLowerCase());
  });
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * filesPerPage,
    currentPage * filesPerPage
  );

  return (
    <div className="min-h-screen bg-[#f0f4ff] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#0c1427] dark:to-[#1a223a] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-[#101a33] rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center ml-5">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  ملفات Excel
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  إدارة وعرض ملفات الإكسل المرفوعة
                </p>
              </div>
            </div>
            <a
              href="/dashboard/sheets/uploadSheets/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 dark:bg-blue-800 dark:hover:bg-blue-900"
            >
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              رفع ملف جديد
            </a>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-300 font-medium">
                    إجمالي الملفات
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {files.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 rounded-xl p-6 border border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-300 font-medium">
                    ملفات قابلة للعرض
                  </p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {files.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900 rounded-xl p-6 border border-purple-200 dark:border-purple-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-300 font-medium">
                    آخر تحديث
                  </p>
                  <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    الآن
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white dark:bg-[#101a33] rounded-2xl shadow-xl p-8">
          {/* Search Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">قائمة الملفات</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث باسم الملف..."
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-[#0c1427] dark:text-white text-right"
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            {loading && (
              <div className="flex items-center text-blue-600">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                جارٍ التحميل...
              </div>
            )}
          </div>

          {!loading && filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد نتائج مطابقة
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-6">
                جرب البحث باسم مختلف أو رفع ملف جديد
              </p>
            </div>
          )}

          {!loading && filteredFiles.length > 0 && (
            <div className="space-y-4">
              {paginatedFiles.map((file) => (
                <div
                  key={file.name}
                  className="bg-gray-50 dark:bg-[#18213a] rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center ml-5">
                        <svg
                          className="w-6 h-6 text-blue-600 dark:text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {file.name.split("_").slice(1).join("_")}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          ملف إكسل
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse ">
                      <button
                        onClick={() => handlePreview(file.url, file.name)}
                        className="inline-flex items-center ml-5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        عرض
                      </button>
                      <button
                        onClick={() => handleDownload(file.url, file.name)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-800 dark:hover:bg-green-900 transition-colors ml-5"
                      >
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        تحميل
                      </button>
                      <button
                        onClick={() => handleShare(file.name)}
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-800 transition-colors ml-5"
                      >
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 8a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2 20h20M12 17v3"
                          />
                        </svg>
                        مشاركة
                      </button>
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white dark:bg-[#18213a] text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                    }`}
                  >
                    السابق
                  </button>
                  <span className="mx-2 text-gray-700 dark:text-gray-200">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white dark:bg-[#18213a] text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                    }`}
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewData && (
          <div
            ref={previewRef}
            className="bg-white dark:bg-[#101a33] rounded-2xl shadow-xl p-8 mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    عرض البيانات
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {previewName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setPreviewName("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-[#18213a]">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#101a33] divide-y divide-gray-200 dark:divide-gray-800">
                      {previewData.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-[#18213a] transition-colors"
                        >
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
