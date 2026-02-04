import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import api from "../../services/apiClient";

import HeroBanner from "./components/HeroBanner";
import Collections from "./components/Collections";
import Products from "./components/Products/Products";
import Trending from "./components/Trending/Trending";
import FlashSale from "./components/FlashSale";
import Testimonials from "./components/Testimonials/Testimonials";
import WhyChooseUs from "./components/WhyChooseUs";
import Newsletter from "./components/Newsletter";
import SeasonalBanner from "./components/SeasonalBanner";
import ShopByPrice from "./components/ShopByPrice";
import ShopByStyle from "./components/ShopByStyle";
import InstagramFeed from "./components/InstagramFeed";
import BrandStory from "./components/BrandStory";

export default function HomePage() {
  const params = useMemo(() => ({ page: 1, limit: 20 }), []);

  const q = useQuery({
    queryKey: ["home-products", params],
    queryFn: async () => {
      const { data } = await api.get("/products", { params });
      return data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const productsData = q.data;

  // Initial load only (after we have data, do not show skeleton again on background refetch)
  const loading = q.isPending && !productsData;

  const error = q.isError ? q.error : null;

  return (
    <div>
      <HeroBanner />
      <Collections />

      <Trending trend={productsData} loading={loading} error={error} />
      <Products product={productsData} loading={loading} error={error} />

      <FlashSale />
      <Testimonials />
      <WhyChooseUs />
      <Newsletter />
      <SeasonalBanner />
      <ShopByPrice />
      <ShopByStyle />
      <InstagramFeed />
      <BrandStory />
    </div>
  );
}
