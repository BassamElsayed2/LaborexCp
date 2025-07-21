"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  getProducts,
  updateProduct,
  uploadProductImages,
  Product,
} from "../../../../../../../services/apiProduct";
import {
  Editor,
  EditorProvider,
  ContentEditableEvent,
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnStrikeThrough,
  BtnStyles,
  BtnUnderline,
  BtnUndo,
  HtmlButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";

const EditProductForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [contentAr, setContentAr] = useState<string>("");
  const [contentEn, setContentEn] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Partial<Product>>();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const products = await getProducts();
        const found = products.find((p: Product) => p.id === id);
        if (!found) {
          toast.error("لم يتم العثور على المنتج");
          router.push("/dashboard/e-commerce");
          return;
        }
        setProduct(found);
        setValue("title_ar", found.title_ar);
        setValue("title_en", found.title_en);
        setValue("yt_code", found.yt_code);
        setContentAr(found.content_ar || "");
        setContentEn(found.content_en || "");
        setServerImages(found.images || []);
        setSelectedImages([]);
      } catch {
        toast.error("خطأ في تحميل المنتج");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...filesArray]);
  };

  const handleRemoveServerImage = (index: number) => {
    setServerImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: Partial<Product>) => {
    try {
      let uploadedUrls: string[] = [];
      if (selectedImages && selectedImages.length > 0) {
        uploadedUrls = await uploadProductImages(selectedImages);
      }
      const allImages = [...serverImages, ...uploadedUrls];
      await updateProduct({
        id: id!,
        ...data,
        images: allImages,
        content_ar: contentAr,
        content_en: contentEn,
      });
      toast.success("تم تحديث المنتج بنجاح");
      router.push("/dashboard/e-commerce");
    } catch {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!product) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        <div className="lg:col-span-12">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="trezo-card-title">
                <h5 className="!mb-0">تعديل المنتج</h5>
              </div>
            </div>
            <div className="trezo-card-content">
              <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
                <div className="mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    عنوان المنتج بالعربية
                  </label>
                  <input
                    type="text"
                    {...register("title_ar", { required: "هذا الحقل مطلوب" })}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                    placeholder="مثال: جوجل بكسل 7 برو"
                  />
                  {errors.title_ar && (
                    <span className="text-red-500 text-sm">
                      {errors.title_ar.message}
                    </span>
                  )}
                </div>
                <div className="mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    عنوان المنتج بالانجليزية
                  </label>
                  <input
                    type="text"
                    {...register("title_en", { required: "هذا الحقل مطلوب" })}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                    placeholder="مثال: Google Pixel 7 Pro"
                  />
                  {errors.title_en && (
                    <span className="text-red-500 text-sm">
                      {errors.title_en.message}
                    </span>
                  )}
                </div>
                <div className="mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    كود يوتيوب (اختياري)
                  </label>
                  <input
                    type="text"
                    {...register("yt_code")}
                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                    placeholder="مثال: dQw4w9WgXcQ"
                  />
                </div>
                <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    وصف المنتج بالعربية
                  </label>
                  <EditorProvider>
                    <Editor
                      value={contentAr}
                      onChange={(e: ContentEditableEvent) =>
                        setContentAr(e.target.value)
                      }
                      style={{
                        minHeight: "200px",
                        fontFamily: "Cairo, sans-serif",
                      }}
                      className="rsw-editor"
                    >
                      <Toolbar>
                        <BtnUndo />
                        <BtnRedo />
                        <Separator />
                        <BtnBold />
                        <BtnItalic />
                        <BtnUnderline />
                        <BtnStrikeThrough />
                        <Separator />
                        <BtnNumberedList />
                        <BtnBulletList />
                        <Separator />
                        <BtnLink />
                        <BtnClearFormatting />
                        <HtmlButton />
                        <Separator />
                        <BtnStyles />
                      </Toolbar>
                    </Editor>
                  </EditorProvider>
                </div>
                <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    وصف المنتج بالانجليزية
                  </label>
                  <EditorProvider>
                    <Editor
                      value={contentEn}
                      onChange={(e: ContentEditableEvent) =>
                        setContentEn(e.target.value)
                      }
                      style={{ minHeight: "200px" }}
                      className="rsw-editor"
                    >
                      <Toolbar>
                        <BtnUndo />
                        <BtnRedo />
                        <Separator />
                        <BtnBold />
                        <BtnItalic />
                        <BtnUnderline />
                        <BtnStrikeThrough />
                        <Separator />
                        <BtnNumberedList />
                        <BtnBulletList />
                        <Separator />
                        <BtnLink />
                        <BtnClearFormatting />
                        <HtmlButton />
                        <Separator />
                        <BtnStyles />
                      </Toolbar>
                    </Editor>
                  </EditorProvider>
                </div>
                <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    رفع صور المنتج
                  </label>
                  <div id="fileUploader">
                    <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                      <div className="flex items-center justify-center">
                        <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                          <i className="ri-upload-2-line"></i>
                        </div>
                        <p className="leading-[1.5]">
                          <strong className="text-black dark:text-white">
                            اضغط لرفع الصور
                          </strong>
                          <br /> يرجى رفع صور المنتج
                        </p>
                      </div>
                      <input
                        type="file"
                        id="fileInput"
                        multiple
                        accept="image/*"
                        className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                        onChange={handleImageChange}
                      />
                    </div>
                    {/* Image Previews */}
                    <div className="mt-[10px] flex flex-wrap gap-2">
                      {/* صور السيرفر */}
                      {serverImages.map((url, index) => (
                        <div
                          key={`server-${index}`}
                          className="relative w-[50px] h-[50px]"
                        >
                          <Image
                            src={url}
                            alt={`server-img-${index}`}
                            width={50}
                            height={50}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-[-5px] right-[-5px] bg-red-600 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                            onClick={() => handleRemoveServerImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {/* صور الرفع الجديدة */}
                      {selectedImages.map((file, index) => (
                        <div
                          key={`selected-${index}`}
                          className="relative w-[50px] h-[50px]"
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`selected-img-${index}`}
                            width={50}
                            height={50}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                            onClick={() => handleRemoveSelectedImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="trezo-card mb-[25px]">
        <div className="trezo-card-content">
          <button
            type="button"
            onClick={() => router.back()}
            className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
              <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                save
              </i>
              حفظ التغييرات
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditProductForm;
