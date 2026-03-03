import {createBrowserRouter} from 'react-router-dom'
import { lazy, Suspense,AuthRoute } from 'react'
//懒加载
const Mouth=lazy(()=>import('../component/Mouth'))
const New=lazy(()=>import('../component/New'))
const User=lazy(()=>import('../component/User'))
const Year=lazy(()=>import('../component/Year'))
const Layout=lazy(()=>import('../component/Layout'))
const Login=lazy(()=>import('../component/login'))
const AiAnalyse=lazy(()=>import('../component/ai_analyse'))
const router=createBrowserRouter([
    {
        path:'/',
        element:<Layout/>,
         children:[
            {
                path:'mouth',
                element:<Suspense fallback={'加载中'}><Mouth/></Suspense>
            },{
                path:'year',
                element:<Suspense fallback={'加载中'}><Year/></Suspense>
            },{
                path:'/user',
                element:<Suspense fallback={'加载中'}><User/></Suspense>
            },{
                path:'/ai_analyse',
                element:<Suspense fallback={'加载中'}><AiAnalyse/></Suspense>
            }
        ]
    },{
        path:'/new',
        element:<Suspense fallback={'加载中'}><New/></Suspense>
    },{
        path:'/login',
        element:<Suspense fallback={'加载中'}><Login/></Suspense>
    }
    ,{
        index: true,  // 默认路由
        element: <Login />
    },
])
export default router