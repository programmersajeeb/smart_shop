import React from 'react'
import Header from '../../shared/components/Layout/Header/Header'
import { Outlet } from 'react-router'
import Footer from '../../shared/components/Layout/Footer'

function Root() {
  return (
    <>
        <Header />
        <main>
            <Outlet />
        </main>
        <Footer />
    </>
  )
}

export default Root