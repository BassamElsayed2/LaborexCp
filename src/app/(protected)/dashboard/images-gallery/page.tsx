"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getGalleries } from "../../../../../services/apiGallery";
import { useQuery } from "@tanstack/react-query";

const ProductsGrid: React.FC = () => {
  const { data: gallery } = useQuery({
    queryKey: ["galleries"],
    queryFn: getGalleries,
  });

  return (
    <>
      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] mb-[25px]">
        {gallery?.map((image) => (
          <div key={image.id} className="md:mb-[10px] lg:mb-[17px]">
            <div className="relative">
              <span className="block ltr:right-0 rtl:left-0 bottom-0 w-[65px] h-[65px] absolute ltr:rounded-tl-md rtl:rounded-tr-md bg-white dark:bg-[#0c1427]"></span>

              <Link
                href={`/dashboard/images-gallery/${image.id}`}
                className="block rounded-md"
              >
                <div className="relative w-full aspect-[1/1] overflow-hidden rounded-md">
                  <Image
                    src={image.image_urls[0]}
                    alt={image.title_ar}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              <button
                className="rounded-md transition-all z-[1] inline-block absolute ltr:right-0 rtl:left-0 bottom-0 w-[60px] h-[60px] leading-[72px] bg-primary-500 text-white hover:bg-primary-400"
                type="button"
              >
                <Image
                  src={image.image_urls[1]}
                  alt={image.title_ar}
                  width={60}
                  height={60}
                  className="object-cover h-[60px] w-[60px] border-3 border-white"
                />
              </button>
            </div>

            <div className="mt-[19px]">
              <h6 className="!text-md !font-normal">
                <Link
                  href={`/dashboard/images-gallery/${image.id}`}
                  className="transition-all hover:text-primary-500"
                >
                  {image.title_ar}
                </Link>
              </h6>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductsGrid;
