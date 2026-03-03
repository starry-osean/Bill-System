import { Outlet, useNavigate } from "react-router-dom";
import {  useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getBillList } from '../../store/module/billStore'
import { TabBar } from 'antd-mobile'
import {
  BillOutline,
  AddCircleOutline,
  CalculatorOutline,
  UserOutline
} from 'antd-mobile-icons'
import './index.scss'
import _ from 'lodash';


const Layout = () => {
  const dispatch = useDispatch()

  const tabs = [ 
    {
      key: '/mouth', 
      title: '月度账单',
      icon: <BillOutline />,
    },
    {
      key: '/new',
      title: '记账',
      icon: <AddCircleOutline />,
      badge: '5',
    },
    {
      key: '/year', 
      title: '年度账单',
      icon: <CalculatorOutline/>
    },{
      key:'/user',
      title:'个人',
      icon:<UserOutline />
    },{
      key:'/ai_analyse',
      title:'AI分析',
      icon:<CalculatorOutline />
    }
  ]

  useEffect(() => {
    dispatch(getBillList())
  }, [dispatch])

  const navigate = useNavigate()
  const switchRoute = (path) => { 
    navigate(path)
    console.log(path);
  }
  return (
    <div className="layout">
        

      <div className="container">
        <Outlet/> 
      </div>
      <div className="footer">
        <TabBar onChange={switchRoute}>
          {
            tabs.map(item => (
              <TabBar.Item key={item.key} icon={item.icon} title={item.title}/>
            ))
          }
        </TabBar>
      </div>
    </div>
  )
}

export default Layout;