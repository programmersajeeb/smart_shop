import React from 'react'
import Footer from '../../shared/components/Layout/Footer'
import Header from '../../shared/components/Layout/Header/Header'
import Banner from './components/Banner'
import BannerBuilder from '../Dashboard/BannerBuilder'

function HomePage() {
  return (
    <div>
      <Header />
      <Banner />
      <BannerBuilder />
      <Footer />
    </div>
  )
}

export default HomePage