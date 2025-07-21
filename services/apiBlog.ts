import { decode } from "base64-arraybuffer";
import supabase from "./supabase";

export interface blogs {
  title_ar: string;
  title_en: string;
  author?: string;
  content_ar: string;
  content_en: string;
  images?: string[];
  yt_code?: string;
  created_at?: string;
  id?: string;
  user_id?: string;
}

export async function getBlog(
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    search?: string;
    date?: string;
  }
): Promise<{ blogs: blogs[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("blog").select("*", { count: "exact" });

  if (filters?.status) {
    if (filters.status === "normal") {
      query = query.or("status.is.null,status.eq.''");
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.search) {
    query = query.or(
      `title_ar.ilike.%${filters.search}%,title_en.ilike.%${filters.search}%`
    );
  }

  if (filters?.date) {
    const now = new Date();
    const startDate = new Date();

    switch (filters.date) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  query = query.order("created_at", { ascending: false });

  const { data: blog, error, count } = await query.range(from, to);

  if (error) {
    console.error("خطأ في جلب المدونة:", error.message);
    throw new Error("تعذر تحميل المدونة");
  }

  return {
    blogs: blog || [],
    total: count ?? 0,
  };
}

export async function getBlogById(id: string) {
  const { data, error } = await supabase
    .from("blog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function Createblog(newBlog: blogs): Promise<blogs[]> {
  const { data, error } = await supabase
    .from("blog")
    .insert([newBlog])
    .select();

  if (error) {
    console.log(error);
    throw new Error("Blog could not be Created");
  }
  return data;
}

export async function uploadImages(
  files: (File | { base64: string; name: string })[],
  folder = "blog"
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    let fileExt: string;
    let fileName: string;
    let fileData: File | ArrayBuffer;

    if (file instanceof File) {
      fileExt = file.name.split(".").pop()!;
      fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      fileData = file;
    } else {
      // الحالة base64
      fileExt = file.name.split(".").pop()!;
      fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      fileData = decode(file.base64);
    }

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, fileData, {
        contentType: file instanceof File ? file.type : `image/${fileExt}`,
      });

    if (error) {
      console.error("خطأ أثناء رفع الصورة:", error.message);
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  return uploadedUrls;
}

export async function deleteBlog(id: string) {
  console.log("ID to delete:", id);
  const { data: blog, error: fetchError } = await supabase
    .from("blog")
    .select("images")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError);
    throw new Error("حدث خطأ أثناء جلب بيانات المدونة");
  }

  if (blog?.images && Array.isArray(blog.images)) {
    const filePaths = blog.images
      .map((url: string) => {
        const path = new URL(url).pathname;
        const match = path.match(
          /\/storage\/v1\/object\/public\/blog-images\/(.+)/
        );
        return match?.[1];
      })
      .filter(Boolean) as string[];

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("blog-images")
        .remove(filePaths);

      if (storageError) {
        console.error("فشل حذف الصور:", storageError);
      }
    }
  }

  const { error: deleteError, data } = await supabase
    .from("blog")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new Error("حدث خطأ أثناء حذف المدونة");
  }

  return data;
}

export async function updateBlog(id: string, updatedBlog: Partial<blogs>) {
  const { data, error } = await supabase
    .from("blog")
    .update(updatedBlog)
    .eq("id", id)
    .select();

  if (error) {
    console.error("خطأ في تحديث المدونة:", error.message);
    throw new Error("تعذر تحديث المدونة");
  }

  return data;
}
