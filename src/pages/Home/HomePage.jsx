import React from 'react'
import HeroBanner from './components/HeroBanner'
import Collections from './components/Collections'
import Products from './components/Products/Products'
import Trending from './components/Trending/Trending'
import FlashSale from './components/FlashSale'
import Testimonials from './components/Testimonials/Testimonials'
import WhyChooseUs from './components/WhyChooseUs'
import Newsletter from './components/Newsletter'
import SeasonalBanner from './components/SeasonalBanner'
import ShopByPrice from './components/ShopByPrice'
import ShopByStyle from './components/ShopByStyle'
import InstagramFeed from './components/InstagramFeed'
import BrandStory from './components/BrandStory'
import { useLoaderData } from 'react-router'

function HomePage() {
  const products = useLoaderData();
  return (
    <div>
      <HeroBanner />
      <Collections />
      <Trending trend={products} />
      <Products product ={products}/>
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
  )
}

export default HomePage