import React from "react";
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
  const q = useQuery({
    queryKey: ["home-page"],
    queryFn: async () => {
      const { data } = await api.get("/products/home");
      return data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const homeData = q.data?.home || null;
  const loading = q.isPending && !homeData;
  const error = q.isError ? q.error : null;

  return (
    <div>
      <HeroBanner data={homeData?.hero} loading={loading} error={error} />
      <Collections data={homeData?.collections} loading={loading} error={error} />

      <Trending
        data={homeData?.trending}
        loading={loading}
        error={error}
      />

      <Products
        data={homeData?.bestSellers}
        loading={loading}
        error={error}
      />

      <FlashSale data={homeData?.flashSale} loading={loading} error={error} />
      {/* <Testimonials data={homeData?.testimonials} loading={loading} error={error} /> */}
      <WhyChooseUs data={homeData?.whyChooseUs} loading={loading} error={error} />
      <Newsletter data={homeData?.newsletter} loading={loading} error={error} />
      <SeasonalBanner data={homeData?.seasonalBanner} loading={loading} error={error} />
      <ShopByPrice data={homeData?.shopByPrice} loading={loading} error={error} />
      <ShopByStyle data={homeData?.shopByStyle} loading={loading} error={error} />
      <InstagramFeed data={homeData?.instagramFeed} loading={loading} error={error} />
      <BrandStory data={homeData?.brandStory} loading={loading} error={error} />
    </div>
  );
}