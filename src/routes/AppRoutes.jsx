import React from 'react'
import {createBrowserRouter} from 'react-router';
import Root from '../pages/Root/Root';
import NotFound from '../pages/NotFound/NotFound';
import HomePage from '../pages/Home/HomePage';
import AboutUsPage from '../pages/Company/About/AboutUsPage';
import ContactUsPage from '../pages/Company/ContactUs/ContactUsPage';
import ShopPage from '../pages/Shop/ShopPage';

export const AppRoutes = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        errorElement: <NotFound/>,
        children: [
            {
                index: true,
                loader: () => fetch('https://dummyjson.com/products'),
                path: "/",
                Component: HomePage
            },
            {
                path: "/shop",
                Component: ShopPage
            },
            {
                path: "/about",
                Component: AboutUsPage
            },
            {
                path: "/contact",
                Component: ContactUsPage
            }

            
        ]
    }
]);
