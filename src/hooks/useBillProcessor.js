import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useWebWorker } from './useWebWorker';

/**
 * 专门用于账单数据处理和AI分析的Hook
 * @param {Array} billList - 账单列表
 * @param {string} rangeLabel - 时间范围标签
 * @returns {object} - 处理结果和方法
 */
export const useBillProcessor = (billList = [], rangeLabel = '全部账单') => {
  // 使用现有的web worker
  const workerPath = `${process.env.PUBLIC_URL || ''}/workers/billCalculator.worker.js`;
  const { result, error, loading, postMessage } = useWebWorker(workerPath);


  // 向量知识库状态
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [qaPrompt, setQaPrompt] = useState(null);

  // 异步请求管理
  const pendingPromises = useRef(new Map());

  // 缓存处理后的账单数据
  const processedData = useMemo(() => {
    if (!billList.length) return null;
    return billList.map(item => ({
      ...item,
      // 数据标准化
      money: Number(item.money) || 0,
      date: item.date,
      category: item.category || item.useFor || '其他',
      description: item.description || '',
      // 添加计算字段
      absMoney: Math.abs(Number(item.money) || 0),
      isIncome: (Number(item.money) || 0) > 0,
      isExpense: (Number(item.money) || 0) < 0
    }));
  }, [billList]);

  // 处理向量知识库相关结果
  useEffect(() => {
    if (!result) return;

    switch (result.type) {
      case 'BUILD_VECTOR_KNOWLEDGE_BASE_SUCCESS':
        console.log('useBillProcessor: 接收到构建结果');
        console.log('接收到的完整数据:', result.data);
        console.log(' 知识库对象:', result.data.knowledgeBase);
        console.log('知识库元数据数量:', result.data.knowledgeBase?.metadata?.length || 0);
        setKnowledgeBase(result.data.knowledgeBase);

        // resolve Promise
        if (result.data?.messageId) {
          const promise = pendingPromises.current.get(result.data.messageId);
          if (promise) {
            promise.resolve(result.data.knowledgeBase);
            pendingPromises.current.delete(result.data.messageId);
          }
        }

        console.log('知识库状态已更新');
        break;
        //处理向量搜索结果
      case 'VECTOR_SEARCH_SUCCESS':
        console.log(' useBillProcessor: 接收到向量搜索结果');
        console.log('搜索结果数据:', result.data);
        console.log('结果数组:', result.data?.results);
        console.log(' 结果数量:', result.data?.results?.length || 0);
        setSearchResults(result.data);

        // 如果有messageId，resolve相应的Promise
        if (result.data?.messageId) {
          const promise = pendingPromises.current.get(result.data.messageId);
          if (promise) {
            promise.resolve(result.data.results);
            pendingPromises.current.delete(result.data.messageId);
          }
        }

        console.log('✅ 搜索结果状态已更新');
        break;
      case 'GENERATE_VECTOR_QA_PROMPT_SUCCESS':
        setQaPrompt(result.data);

        // resolve Promise
        if (result.data?.messageId) {
          const promise = pendingPromises.current.get(result.data.messageId);
          if (promise) {
            promise.resolve(result.data);
            pendingPromises.current.delete(result.data.messageId);
          }
        }
        break;
      default:
        break;
    }
  }, [result]);

 
  const processBills = useCallback((customRangeLabel) => {
    if (!processedData?.length) {
      throw new Error('没有可处理的账单数据');
    }

    postMessage('CALCULATE_SUMMARY', {
      billList: processedData,
      rangeLabel: customRangeLabel || rangeLabel
    });
  }, [processedData, rangeLabel, postMessage]);

  /**
   question - 用户问题
 customRangeLabel - 自定义范围标签
   */
  const generatePrompt = useCallback((question = '', customRangeLabel) => {
    if (!processedData?.length) {
      throw new Error('没有可处理的账单数据');
    }

    postMessage('GENERATE_AI_PROMPT', {
      billList: processedData,
      question: question.trim(),
      rangeLabel: customRangeLabel || rangeLabel
    });
  }, [processedData, rangeLabel, postMessage]);

  /**
   * 批量处理多个时间范围
   - 时间范围配置数组
   */
  const batchProcess = useCallback((ranges) => {
    if (!ranges?.length) {
      throw new Error('请提供有效的时间范围配置');
    }

    const processedRanges = ranges.map(range => ({
      label: range.label,
      billList: range.billList.map(item => ({
        ...item,
        money: Number(item.money) || 0,
        date: item.date,
        category: item.category || item.useFor || '其他',
        description: item.description || '',
        absMoney: Math.abs(Number(item.money) || 0),
        isIncome: (Number(item.money) || 0) > 0,
        isExpense: (Number(item.money) || 0) < 0
      }))
    }));

    postMessage('BATCH_CALCULATE', {
      ranges: processedRanges
    });
  }, [postMessage]);

  /**
   * 执行重计算任务（ operation - 操作类型 (sum, average, max, min)
   */
  const heavyCalculation = useCallback((operation = 'sum') => {
    if (!processedData?.length) {
      throw new Error('没有可处理的账单数据');
    }

    postMessage('HEAVY_CALCULATION', {
      items: processedData,
      operation
    });
  }, [processedData, postMessage]);

  // 返回处理结果
  const summary = useMemo(() => {
    if (result?.type === 'CALCULATE_SUMMARY_SUCCESS') {
      return result.data;
    }
    return null;
  }, [result]);

  const prompt = useMemo(() => {
    if (result?.type === 'GENERATE_AI_PROMPT_SUCCESS') {
      return result.data;
    }
    return null;
  }, [result]);

  const batchResults = useMemo(() => {
    if (result?.type === 'BATCH_CALCULATE_SUCCESS') {
      return result.data;
    }
    return null;
  }, [result]);


  /**
   * 构建向量知识库
   */
  const buildVectorKnowledgeBase = useCallback(() => {
    if (!processedData?.length) {
      throw new Error('没有可处理的账单数据');
    }

    console.log('🔧 useBillProcessor: 发送构建请求');
    console.log('📊 发送的账单数据:', processedData);
    console.log('📈 发送的账单数量:', processedData.length);

    return new Promise((resolve, reject) => {
      const messageId = Date.now();
      pendingPromises.current.set(messageId, { resolve, reject });

      postMessage('BUILD_VECTOR_KNOWLEDGE_BASE', {
        messageId,
        billList: processedData
      });
    });
  }, [processedData, postMessage]);

  /**
   * 向量搜索
   * @param {string} query - 搜索查询
   * @param {number} topK - 返回结果数量
   */
  const vectorSearch = useCallback((query, topK = 5) => {
    if (!knowledgeBase) {
      throw new Error('请先构建向量知识库');
    }
    if (!query?.trim()) {
      throw new Error('请提供有效的搜索查询');
    }

    return new Promise((resolve, reject) => {
      // 存储resolve函数，等待Web Worker响应
      const messageId = Date.now();
      pendingPromises.current.set(messageId, { resolve, reject });

      postMessage('VECTOR_SEARCH', {
        messageId,
        knowledgeBase,
        query: query.trim(),
        topK
      });
    });
  }, [knowledgeBase, postMessage]);


  /**
   * 生成向量问答prompt
   * @param {string} query - 用户问题
   * @param {Object} context - 额外上下文
   */
  const generateVectorQAPrompt = useCallback((query, context = {}) => {
    if (!knowledgeBase) {
      throw new Error('请先构建向量知识库');
    }
    if (!query?.trim()) {
      throw new Error('请提供有效的问题');
    }

    return new Promise((resolve, reject) => {
      const messageId = Date.now();
      pendingPromises.current.set(messageId, { resolve, reject });

      postMessage('GENERATE_VECTOR_QA_PROMPT', {
        messageId,
        knowledgeBase,
        query: query.trim(),
        searchResults,
        context
      });
    });
  }, [knowledgeBase, searchResults, postMessage]);


  return {
    // 状态
    loading,

    // 向量知识库状态
    knowledgeBase,
    searchResults,
    qaPrompt,

    // 向量知识库方法
    buildVectorKnowledgeBase,
    vectorSearch,
    generateVectorQAPrompt,

    // 重试相关
    canRetry: false,

    // 数据
    processedData,
    hasData: Boolean(processedData?.length)
  };
};

export default useBillProcessor;
