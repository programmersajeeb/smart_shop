import React from 'react'
import Footer from '../../shared/components/Layout/Footer'
import Header from '../../shared/components/Layout/Header/Header'
import HeroBanner from './components/HeroBanner'

function HomePage() {
  return (
    <div>
      <Header />
      <HeroBanner />
      <Footer />
    </div>
  )
}

export default HomePage