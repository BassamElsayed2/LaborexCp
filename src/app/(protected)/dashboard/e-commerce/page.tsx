"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProducts,
  deleteProduct,
  Product,
} from "../../../../../services/apiProduct";

const ProductsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 10;

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Delete product mutation
  const deleteProductMutation = useMutation<boolean, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف المنتج");
    },
  });

  // Handle product deletion with confirmation
  const handleDeleteProduct = (id: string, name: string) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white dark:bg-[#0c1427] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <i className="material-symbols-outlined text-danger-500">
                  warning
                </i>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  تأكيد الحذف
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  هل أنت متأكد من حذف المنتج &quot;{name}&quot;؟
                </p>
              </div>
            </div>
            <div className="mt-4 flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  deleteProductMutation.mutate(id);
                }}
                className="flex-1 px-4 py-2 bg-danger-500 text-white text-sm font-medium rounded-md hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
              >
                حذف
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#15203c] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-[#1a2942] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 5000,
      }
    );
  };

  // Filter products based on search
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.title_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[20px] md:mb-[25px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <label className="leading-none absolute ltr:left-[13px] rtl:right-[13px] text-black dark:text-white mt-px top-1/2 -translate-y-1/2">
                <i className="material-symbols-outlined !text-[20px]">search</i>
              </label>
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-50 h-[36px] text-xs rounded-md w-full block text-black pt-[11px] pb-[12px] ltr:pl-[38px] rtl:pr-[38px] ltr:pr-[13px] ltr:md:pr-[16px] rtl:pl-[13px] rtl:md:pl-[16px] placeholder:text-gray-500 outline-0 dark:bg-[#15203c] dark:text-white dark:border-[#15203c] dark:placeholder:text-gray-400"
              />
            </div>

            {/* Add Product Button */}
            <div>
              <Link
                href="/dashboard/e-commerce/create-product"
                className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white w-full text-center"
              >
                <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                  <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                    add
                  </i>
                  اضافة منتج جديد
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="trezo-card-content">
          <div className="table-responsive overflow-x-auto">
            <table className="w-full">
              <thead className="text-black dark:text-white">
                <tr>
                  {["الصورة", "العنوان", "يوتيوب", "الإجراءات"].map(
                    (header, index) => (
                      <th
                        key={index}
                        className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] bg-gray-50 dark:bg-[#15203c] whitespace-nowrap ltr:first:rounded-tl-md ltr:last:rounded-tr-md rtl:first:rounded-tr-md rtl:last:rounded-tl-md"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="text-black dark:text-white">
                {paginatedProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                      {product.images && product.images.length > 0 && (
                        <Image
                          src={product.images[0] || "/images/placeholder.jpg"}
                          alt={product.title_ar}
                          className="inline-block rounded-md"
                          width={40}
                          height={40}
                        />
                      )}
                    </td>
                    <td className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                      {product.title_ar}
                    </td>
                    <td className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                      {product.yt_code && (
                        <a
                          href={`https://youtube.com/watch?v=${product.yt_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 underline"
                        >
                          رابط
                        </a>
                      )}
                    </td>
                    <td className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                      <div className="flex items-center gap-[9px]">
                        <Link
                          href={`/dashboard/e-commerce/edit-product/${product.id}`}
                          className="text-gray-500 dark:text-gray-400 leading-none custom-tooltip"
                          title="تعديل"
                        >
                          <i className="material-symbols-outlined !text-md">
                            edit
                          </i>
                        </Link>
                        <button
                          type="button"
                          className="text-danger-500 leading-none custom-tooltip"
                          onClick={() =>
                            handleDeleteProduct(product.id, product.title_ar)
                          }
                          title="حذف"
                        >
                          <i className="material-symbols-outlined !text-md">
                            delete
                          </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-[20px] py-[12px] md:py-[14px] rounded-b-md border-l border-r border-b border-gray-100 dark:border-[#172036] sm:flex sm:items-center justify-between">
            <p className="!mb-0 !text-sm text-gray-500 dark:text-gray-400">
              عرض {paginatedProducts.length} من {filteredProducts.length} نتيجة
            </p>

            <div className="mt-[10px] sm:mt-0 flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  first_page
                </i>
              </button>

              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  chevron_left
                </i>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[36px] h-[36px] flex items-center justify-center rounded-md border transition-all ${
                      currentPage === pageNum
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  chevron_right
                </i>
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  last_page
                </i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsList;
