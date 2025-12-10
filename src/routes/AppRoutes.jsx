import React from 'react'
import {createBrowserRouter} from 'react-router';
import Root from '../pages/Root/Root';
import NotFound from '../pages/NotFound/NotFound';
import HomePage from '../pages/Home/HomePage';

export const AppRoutes = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        errorElement: <NotFound/>,
        children: [
            {
                index: true,
                path: "/",
                Component: HomePage
            },
            
        ]
    }
]);
