"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SheetRow {
  [key: string]: string | number | boolean | null;
}

export default function SheetPreviewPage() {
  const { fileName } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SheetRow[] | null>(null);
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchAndPreview = async () => {
      setLoading(true);
      setError("");
      setData(null);
      if (!fileName || typeof fileName !== "string") {
        setError("اسم الملف غير صالح");
        setLoading(false);
        return;
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("sheets")
        .getPublicUrl(fileName);
      if (!publicUrlData?.publicUrl) {
        setError("تعذر الحصول على رابط الملف");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(publicUrlData.publicUrl);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const wb = XLSX.read(arrayBuffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<SheetRow>(ws);
        setData(json);
        setTimeout(() => {
          if (previewRef.current) {
            previewRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      } catch {
        setError("تعذر قراءة الملف أو الملف غير صالح");
      } finally {
        setLoading(false);
      }
    };
    fetchAndPreview();
    // eslint-disable-next-line
  }, [fileName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#0c1427] dark:to-[#1a223a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white dark:bg-[#101a33] rounded-2xl shadow-xl p-8 mt-8"
          ref={previewRef}
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            عرض ملف الإكسل
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300 break-all">
            {fileName}
          </p>
          {loading && <div className="text-blue-600">جاري التحميل...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {data && data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[#18213a]">
                  <tr>
                    {Object.keys(data[0] || {}).map((key) => (
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
                  {data.map((row, i) => (
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
          )}
          {data && data.length === 0 && !loading && !error && (
            <div className="text-gray-500">
              الملف فارغ أو لا يحتوي على بيانات قابلة للعرض
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
