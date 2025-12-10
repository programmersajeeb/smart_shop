import React from 'react'

export default function CategoryNavbar() {
    return (
        <div>
            <div className='container mx-auto'>
                <div className="dropdown dropdown-start">
                            <div tabIndex={0} role="button" className="btn m-1">Click ⬇️</div>
                            <ul
                                tabIndex="-1"
                                className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                <li>
                                    <a>Item 1</a>
                                </li>
                                <li>
                                    <a>Item 2</a>
                                </li>
                            </ul>
                        </div>
                        <div className="dropdown dropdown-start">
                            <div tabIndex={0} role="button" className="btn m-1">Click ⬇️</div>
                            <ul
                                tabIndex="-1"
                                className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                <li>
                                    <a>Item 1</a>
                                </li>
                                <li>
                                    <a>Item 2</a>
                                </li>
                            </ul>
                        </div>
                <ul className="flex gap-4 p-4">
                    <li>
                        
                    </li>

                </ul>
            </div>
        </div>
    )
}
