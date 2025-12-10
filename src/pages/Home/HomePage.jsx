import React from 'react'
import Footer from '../../shared/components/Layout/Footer'
import Header from '../../shared/components/Layout/Header/Header'
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

function HomePage() {
  return (
    <div>
      <HeroBanner />
      <Collections />
      <Trending />
      <Products />
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