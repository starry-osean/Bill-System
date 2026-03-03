import dayjs from "dayjs";
import { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { DatePicker, NavBar } from "antd-mobile";
import _ from "lodash";
import './index.scss'; 
import * as echarts from 'echarts';

const Year = () => {
    const billList = useSelector(state => state.bill.billList);
    const [dateVisible, setDateVisible] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date());
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const format = dayjs(currentYear).format('YYYY');

    // 按年份分组
    const YearGroup = useMemo(() => {
        return _.groupBy(billList, item => dayjs(item.date).format('YYYY'));
    }, [billList]);

    // 计算当前年份的统计数据
    const currentYearStats = useMemo(() => {
        const currentBills = YearGroup[format] || [];
        const income = currentBills
            .filter(item => item.money > 0)
            .reduce((sum, item) => sum + item.money, 0);
        
        const expense = currentBills
            .filter(item => item.money < 0)
            .reduce((sum, item) => sum + Math.abs(item.money), 0);
        
        const balance = income - expense;
        
        return {
            income,
            expense,
            balance,
            bills: currentBills
        };
    }, [YearGroup, format]);

    // 计算每个月份的汇总数据
    const monthlyStats = useMemo(() => {
        if (!currentYearStats.bills || currentYearStats.bills.length === 0) {
            return [];
        }
        
        // 按月份分组
        const monthGroup = _.groupBy(currentYearStats.bills, item => 
            dayjs(item.date).format('YYYY-MM')
        );
        
        // 计算每个月份的收入、支出和结余
        const monthlyData = Object.entries(monthGroup).map(([month, bills]) => {
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
                count: bills.length // 交易笔数
            };
        });
        
        // 按月份倒序排列
        return monthlyData.sort((a, b) => b.month.localeCompare(a.month));
    }, [currentYearStats.bills]);

    // 初始化图表
    useEffect(() => {
        if (chartRef.current && monthlyStats.length > 0) {
            // 销毁之前的图表实例
            if (chartInstance.current) {
                chartInstance.current.dispose();
            }
            
            // 初始化新图表
            chartInstance.current = echarts.init(chartRef.current);
            
            // 准备图表数据 - 使用月度支出数据
            const chartData = monthlyStats.map(item => ({
                value: item.expense,
                name: dayjs(item.month).format('MM月')
            }));
            //构造月度支出的饼图数据
            const option = {
                title: {
                    text: '月度支出分布',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: chartData.map(item => item.name)
                },
                series: [
                    {
                        name: '月度支出',
                        type: 'pie',
                        radius: '50%',
                        data: chartData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            //设置图表的配置项 setOption 渲染
            chartInstance.current.setOption(option);

            // 响应式调整
            const handleResize = () => {
                //在窗口大小改变时调整图表大小
                chartInstance.current?.resize();
            };
            window.addEventListener('resize', handleResize);

            // 清理函数
            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartInstance.current) {
                    chartInstance.current.dispose();
                    chartInstance.current = null;
                }
            };
        }
    }, [monthlyStats]);

    const onConfirm = (date) => {
        setCurrentYear(date); 
        setDateVisible(false);
    };

    return (
        <div className="yearly-bill">
            <NavBar className="nav" backArrow={false}>
                年度收支
            </NavBar>
            
            <div className="header">
                {/* 日期选择器触发按钮 */}
                <div 
                    className="date-selector"
                    onClick={() => setDateVisible(true)}
                >
                    <span className="text">
                        {dayjs(currentYear).format('YYYY年')}年度账单
                    </span>
                    <span className={`arrow ${dateVisible ? 'open' : ''}`}>
                        ▼
                    </span>
                </div>
                
                {/* 年度概览 */}
                <div className="year-overview">
                    <div className="overview-item">
                        <span className="money income">
                            ¥{currentYearStats.income.toFixed(2)}
                        </span>
                        <span className="type">年收入</span>
                    </div>
                    <div className="overview-item">
                        <span className="money expense">
                            ¥{currentYearStats.expense.toFixed(2)}
                        </span>
                        <span className="type">年支出</span>
                    </div>
                    <div className="overview-item">
                        <span className={`money balance ${currentYearStats.balance >= 0 ? 'positive' : 'negative'}`}>
                            ¥{currentYearStats.balance.toFixed(2)}
                        </span>
                        <span className="type">年结余</span>
                    </div>
                </div>

                {/* 日期选择器 */}
                <DatePicker
                    className="year-picker"
                    title="选择年份"
                    precision="year"
                    visible={dateVisible}
                    onClose={() => setDateVisible(false)}
                    onConfirm={onConfirm}
                    max={new Date()}
                />
            </div>

            {/* 图表区域 */}
            {monthlyStats.length > 0 && (
                <div className="chart-section">
                    <div 
                        ref={chartRef} 
                        className="chart-container"
                        style={{ width: '100%', height: '550px' ,backgroundColor:"white"}}
                    />
                </div>
            )}

            {/* 月度明细 */}
            <div className="monthly-breakdown">
                <h3>月度明细</h3>
                {monthlyStats.length > 0 ? (
                    <div className="month-list">
                        {monthlyStats.map(monthData => (
                            <div key={monthData.month} className="month-item">
                                <div className="month-header">
                                    <h4>{dayjs(monthData.month).format('YYYY年MM月')}</h4>
                                    <span className={`balance ${monthData.balance >= 0 ? 'positive' : 'negative'}`}>
                                        ¥{monthData.balance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="month-details">
                                    <div className="detail">
                                        <span>收入：</span>
                                        <span className="income">¥{monthData.income.toFixed(2)}</span>
                                    </div>
                                    <div className="detail">
                                        <span>支出：</span>
                                        <span className="expense">¥{monthData.expense.toFixed(2)}</span>
                                    </div>
                                    <div className="detail">
                                        <span>交易笔数：</span>
                                        <span>{monthData.count}笔</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-data">暂无月度数据</div>
                )}
            </div>
        </div>
    );
}

export default Year;