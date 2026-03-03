import { NavBar, DatePicker } from "antd-mobile";
import { useEffect, useMemo, useState } from "react";
import  {useNavigate } from "react-router-dom";
import './index.scss'
import { useDispatch, useSelector } from "react-redux";
import _ from 'lodash';
import dayjs from "dayjs";
import DayBill from "./Day/DayBill";

const Month = () => {
  const [dateVisible, setDateVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const billList = useSelector(state => state.bill.billList);
  const dispatch=useDispatch();
  // 格式化选中的日期为 YYYY-MM
  const formattedDate = dayjs(selectedDate).format('YYYY-MM');
  
  // 按月份分组账单
  const monthGroup = useMemo(() => {
    return _.groupBy(billList, (item) => dayjs(item.date).format('YYYY-MM'));
  }, [billList]);
 
  

  // 获取当前选中月份的统计数据
  const currentMonthStats = useMemo(() => {
    const currentMonthBills = monthGroup[formattedDate] || [];
    
    const income = currentMonthBills
      .filter(item => item.money > 0)
      .reduce((sum, item) => sum + item.money, 0);
    
    const expense = currentMonthBills
      .filter(item => item.money < 0)
      .reduce((sum, item) => sum + Math.abs(item.money), 0);
    
    const balance = income - expense;
    
    return {
      income,
      expense,
      balance,
      bills: currentMonthBills
    };
  }, [monthGroup, formattedDate]);

  // 所有月份的汇总数据（用于显示月份列表）
  const monthSummary = useMemo(() => {
    return Object.entries(monthGroup).map(([month, bills]) => {
      const income = bills
        .filter(item => item.money > 0)
        .reduce((sum, item) => sum + item.money, 0);
      
      const expense = bills
        .filter(item => item.money < 0)
        .reduce((sum, item) => sum + Math.abs(item.money), 0);
      
      const balance = income - expense;
      
      return {
        month,
        income,
        expense,
        balance,
        count: bills.length
      };
    }).sort((a, b) => b.month.localeCompare(a.month)); // 按月份倒序排列
  }, [monthGroup]);
   const dayGroup=useMemo(() => {
    const GroupData=_.groupBy(currentMonthStats.bills, (item) => dayjs(item.date).format('YYYY-MM-DD'));
    const keys=Object.keys(GroupData)
    return {
      keys,
      GroupData
    }
  }, [currentMonthStats.bills]);
  console.log('is',dayGroup);
  const onConfirm = (date) => {
    setSelectedDate(date);
    setDateVisible(false);
  };
  const nav=useNavigate()
  const Mobile=localStorage.getItem('Mobile')
  const loginOut=()=>{
    localStorage.removeItem('Mouth')
    localStorage.removeItem('token_key')
    nav('/login')
    alert('退出成功')
  }

  return (
    <div className="monthlyBill">
      <div className="humam">
          <div className="img">
                <img src="/logo.png"></img>
          </div>
          <div>
              <p><span>尊贵的{Mobile}用户</span>,欢迎回来</p>
          </div>
          <div className="tip" onClick={loginOut}>
                <svg t="1762953576428" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2412" width="30" height="30"><path d="M0 192v640c0 70.7 57.3 128 128 128h352c17.7 0 32-14.3 32-32s-14.3-32-32-32H128c-35.3 0-64-28.7-64-64V192c0-35.3 28.7-64 64-64h352c17.7 0 32-14.3 32-32s-14.3-32-32-32H128C57.3 64 0 121.3 0 192z" p-id="2413" fill="#2c2c2c"></path><path d="M1013.3 535.7L650.9 863.3c-41.1 37.2-106.9 8-106.9-47.5V685c0-4.4-3.6-8-8-8H224c-17.7 0-32-14.3-32-32V379c0-17.7 14.3-32 32-32h312c4.4 0 8-3.6 8-8V208.1c0-55.5 65.8-84.7 106.9-47.5l362.4 327.6c14.1 12.8 14.1 34.8 0 47.5z" p-id="2414" fill="#2c2c2c"></path></svg>
          </div>
      </div>
      <NavBar className="nav" backArrow={false}>
        月度收支
      </NavBar>
      <div className="content">
        <div className="header"> 
          {/* 日期选择器 */}
          <div 
            className="date" 
            onClick={() => setDateVisible(true)}
          >
            <span className="text">
              {dayjs(selectedDate).format('YYYY年MM月')}账单
            </span>
            <span className={`arrow ${dateVisible ? 'open' : ''}`}>
              ▼
            </span>
          </div>
          
          {/* 月度概览 */}
          <div className="twoLineOverview">
            <div className="item">
              <span className="money expense">
                ¥{currentMonthStats.expense.toFixed(2)}
              </span>
              <span className="type">
                支出
              </span>
            </div>
            <div className="item">
              <span className="money income">
                ¥{currentMonthStats.income.toFixed(2)}
              </span>
              <span className="type">
                收入
              </span>
            </div>
            <div className="item">
              <span className={`money balance ${currentMonthStats.balance >= 0 ? 'positive' : 'negative'}`}>
                ¥{currentMonthStats.balance.toFixed(2)}
              </span>
              <span className="type">
                结余
              </span>
            </div>
          </div>
          
          <DatePicker
            className="kaDate"
            title="选择月份"
            precision="month"
            visible={dateVisible}
            onClose={() => setDateVisible(false)}
            onConfirm={onConfirm}
            max={new Date()} 
          />{/*当前时间对应的 Date 对象通过 prop 名 max 传给子组件*/}
        </div>
        <p style={  {fontWeight:600,fontSize:"20px"}}>详细账单</p>
        {
          dayGroup.keys.map(key=>{
            return    <DayBill  key={key} date={key} 
                        billList={dayGroup.GroupData[key]}
                      />
          })
        }
     
        {/* 月份列表 */}
        <div className="monthList">
          {monthSummary.map(monthData => (
            <div key={monthData.month} className="monthItem">
              <div className="monthHeader">
                <span className="monthTitle">
                  {dayjs(monthData.month).format('YYYY年MM月')}
                </span>
                <span className={`monthAmount ${monthData.balance >= 0 ? 'positive' : 'negative'}`}>
                  ¥{monthData.balance.toFixed(2)}
                </span>
              </div>
              <div className="monthDetails">
                <div className="detailItem">
                  <div className="label">收入</div>
                  <div className="value income">¥{monthData.income.toFixed(2)}</div>
                </div>
                <div className="detailItem">
                  <div className="label">支出</div>
                  <div className="value expense">¥{monthData.expense.toFixed(2)}</div>
                </div>
                <div className="detailItem">
                  <div className="label">交易笔数</div>
                  <div className="value">{monthData.count}笔</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {currentMonthStats.bills.length === 0 && (
          <div className="emptyState">
            <div className="emptyText">暂无账单数据</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Month;