import { createSlice } from '@reduxjs/toolkit';
import { fetchBillAnalysis } from '../../api/ai';
import dayjs from 'dayjs';
import _ from 'lodash';

const initialState = {
  loading: false,
  error: null,
  result: '',
  time: '',
  person: '',
  reason: '',
  suggestion: '',
  conclusion: '',
  summary: '',
  question: '',
  rawSummary: null,
  rawResponse: null
};

const analyseSlice = createSlice({
  name: 'analyse',
  initialState,
  reducers: {
    setAnalyseLoading(state, action) {
      state.loading = action.payload;
    },
    setAnalyseError(state, action) {
      state.error = action.payload;
    },
    setAnalyse(state, action) {
      return { ...state, ...action.payload };//包含原 state 的所有属性，属性覆盖或新增到新对象中
    },
    resetAnalyse() {
      return initialState;
    },
    getAnalyse(state, action) {
      state.result = action.payload;
    },
    setAnalyseQuestion(state, action) {
      state.question = action.payload;
      
    }
  }
});

export const {
  setAnalyseLoading,
  setAnalyseError,
  setAnalyse,
  resetAnalyse,
  getAnalyse,
  setAnalyseQuestion
} = analyseSlice.actions;

/** 将 billList 聚合成结构化 summary */
const buildSummary = (billList = [], rangeLabel = '全部账单') => {
  const normalized = billList.map(item => ({
    id: item.id,
    money: item.money || 0,
    type: item.type || 'expense',
    category: item.category || item.useFor || '其他',
    description: item.description || '',
    date: dayjs(item.date).format('YYYY-MM-DD')
  }));

  const income = normalized
    .filter(i => i.money > 0)
    .reduce((sum, cur) => sum + cur.money, 0);
  const expense = normalized
    .filter(i => i.money < 0)
    .reduce((sum, cur) => sum + Math.abs(cur.money), 0);
  const balance = income - expense;
  //分类聚合
  const categoryGroup = _(normalized)
    .filter(i => i.money < 0)// 1. 过滤：只看支出
    .groupBy('category')//分组：按类别聚类
    .map((items, key) => ({//映射：计算每个类别的总和
      name: key,//分类名称
      expense: items.reduce((s, cur) => s + Math.abs(cur.money), 0)//支出金额
    }))
    .orderBy('expense', 'desc')// 5. 按支出降序排序 // 排序：找重点
    .slice(0, 5) //  取前5个  截断：只取 Top5，丢弃长尾数据
    .value(); // 转换为数组
  //时间聚合
  const dailyTrend = _(normalized)
    .groupBy('date')//按日期分组
    .map((items, key) => ({
      date: key,
      income: items.filter(i => i.money > 0).reduce((s, cur) => s + cur.money, 0),
      expense: items.filter(i => i.money < 0).reduce((s, cur) => s + Math.abs(cur.money), 0)
    }))
    .orderBy('date', 'asc')// 6. 按日期升序排序
    .value();
  //装成一个高密度的 JSON 对象
  return {
    range: rangeLabel,
    income,
    expense,
    balance,
    topCategories: categoryGroup,//支出TOP分类
    dailyTrend,
    totalCount: normalized.length
  };
};

/** 触发 AI 分析 */
export const analyseBill = (billList = [], rangeLabel = '全部账单', question = '') => async (dispatch) => {
  try {
    dispatch(setAnalyseLoading(true));
    dispatch(setAnalyseError(null));

    if (!billList.length) {
      dispatch(setAnalyseError('暂无账单可分析'));
      return;
    }

    const summary = buildSummary(billList, rangeLabel);
    const trimmedQuestion = (question || '').trim();

    const payload = {
      "model": "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
      "messages": [
        {"role": "system", "content": "你是专业的家庭记账分析师。"},
        {
          "role": "user",
          "content": trimmedQuestion
            ? `账单统计：${JSON.stringify(summary)}。请重点回答：${trimmedQuestion}`
            : `账单统计：${JSON.stringify(summary)}`//对象转换为 JSON 字符串
        }
      ]
    };

    console.log('AI 请求参数:', payload);
    
    // 调用 API 并等待响应
    const data = await fetchBillAnalysis(payload);
    console.log('AI 分析结果:', data);
    
    // 更新状态
    dispatch(setAnalyse({
      result: data?.suggestion || '',
      suggestion: data?.suggestion || '',
      reason: rangeLabel,
      time: dayjs().format('YYYY年MM月DD日 HH:mm'),
      person: 'deepseek分析助手',
      question: trimmedQuestion,
      rawSummary: summary,
      rawResponse: data?.raw || null,
      loading: false
    }));
    
    return data;
  } catch (error) {
    console.error('AI 分析失败:', error);
    dispatch(setAnalyseError(error.message || '分析失败'));
    dispatch(setAnalyseLoading(false));
  }
};
/** 处理流式响应的版本 */

const analyseReducer = analyseSlice.reducer;
export default analyseReducer;