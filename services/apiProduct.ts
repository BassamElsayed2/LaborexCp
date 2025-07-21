import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProductFormData {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  images: File[];
  yt_code?: string;
}

export interface Product {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  images: string[];
  yt_code?: string;
  created_at?: string;
}

export const createProduct = async (data: ProductFormData) => {
  try {
    // رفع الصور
    const imageUrls = await Promise.all(
      data.images.map(async (image) => {
        const fileName = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("productsimgs")
          .upload(fileName, image);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("productsimgs").getPublicUrl(fileName);
        return publicUrl;
      })
    );
    // إضافة المنتج
    const { data: product, error } = await supabase
      .from("product")
      .insert([
        {
          title_ar: data.title_ar,
          title_en: data.title_en,
          content_ar: data.content_ar,
          content_en: data.content_en,
          images: imageUrls,
          yt_code: data.yt_code || null,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return product;
  } catch (error) {
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from("product")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data as Product[];
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { error } = await supabase.from("product").delete().eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (
  data: Partial<Product> & { id: string }
) => {
  try {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("product")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
};

export const uploadProductImages = async (files: File[]): Promise<string[]> => {
  const imageUrls: string[] = [];
  for (const image of files) {
    const fileName = `${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("productsimgs")
      .upload(fileName, image);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from("productsimgs").getPublicUrl(fileName);
    imageUrls.push(publicUrl);
  }
  return imageUrls;
};
