import { useMemo, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyseBill, resetAnalyse } from '../../store/module/analyse';
import { useBillProcessor } from '../../hooks/useBillProcessor';
import { Button, Input, Toast, Card, Rate } from 'antd-mobile';
import tensorflowAIModel, { initializeTensorFlowAI, generateTensorFlowResponse } from '../../services/tensorflowAI';
import './index.scss';
import dayjs from 'dayjs';
const AiAnalyse = () => {
  const dispatch = useDispatch();
  const { billList } = useSelector(state => state.bill);
  const analyse = useSelector(state => state.analyse);

  // 向量问答相关状态
  const [vectorQuestion, setVectorQuestion] = useState('');
  const [vectorAnswers, setVectorAnswers] = useState([]);
  const [localAIModelReady, setLocalAIModelReady] = useState(false);
  const [vectorSearchResults, setVectorSearchResults] = useState(null);

  // 用户反馈相关状态
  const [feedbackRatings, setFeedbackRatings] = useState({});
  const [feedbackComments, setFeedbackComments] = useState({});


  // 使用Web Worker处理账单数据
  const {
    loading: workerLoading,
    hasData,
    canRetry,
    knowledgeBase,
    searchResults,
    buildVectorKnowledgeBase,
    vectorSearch,
    generateVectorQAPrompt,
    processedData
  } = useBillProcessor(billList, '全部账单');

  // 初始化TensorFlow.js AI模型
  useEffect(() => {
    const initTensorFlowAI = async () => {
      console.log(' 正在初始化TensorFlow.js AI模型...');
      console.log('加载Universal Sentence Encoder...');

      const startTime = Date.now();
      const success = await initializeTensorFlowAI();
      const loadTime = Date.now() - startTime;

      setLocalAIModelReady(success);

      if (success) {
        console.log(' TensorFlow.js AI模型初始化成功');
        console.log('加载时间:', loadTime, 'ms');
        console.log('模型能力:');
        console.log(' 语义理解: Universal Sentence Encoder (768维)');
        console.log(' 问题分类: 支出/收入/趋势/建议/统计');
        console.log(' 智能分析: 基于机器学习的账单分析');
        console.log('  端侧推理: 完全本地处理，无网络依赖');
        console.log(' AI模型已就绪，可以开始智能问答了！');
      } else {
        console.log(' TensorFlow.js AI模型初始化失败');
        console.log(' 请检查:');
        console.log('网络连接是否正常');
        console.log(' 浏览器是否支持WebGL');
        console.log(' 控制台是否有错误信息');
      }
    };
    initTensorFlowAI();
  }, []);

  // 打印系统完整状态到控制台
  const printSystemStatus = useCallback(() => {
    console.log(' ===== 向量问答系统完整状态 =====');
    console.log('');

    // 1. 知识库状态
    console.log(' 知识库状态:');
    console.log('是否构建:', knowledgeBase ? ' 已构建' : ' 未构建');
    console.log(' 元数据数量:', knowledgeBase?.metadata?.length || 0);
    console.log('  向量维度:', knowledgeBase?.dimensions || 0);
    console.log('向量数组长度:', knowledgeBase?.vectors?.length || 0);

    if (knowledgeBase?.metadata?.length > 0) {
      const categoryStats = knowledgeBase.metadata.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      console.log('类别统计:', categoryStats);

      const dates = knowledgeBase.metadata.map(item => new Date(item.date).getTime());
      const startDate = new Date(Math.min(...dates)).toLocaleDateString();
      const endDate = new Date(Math.max(...dates)).toLocaleDateString();
      console.log(' 时间范围:', `${startDate} - ${endDate}`);

      const amounts = knowledgeBase.metadata.map(item => item.amount);
      const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
      const avgAmount = totalAmount / amounts.length;
      console.log(' 金额统计:', {
        总数: `¥${totalAmount.toFixed(2)}`,
        平均: `¥${avgAmount.toFixed(2)}`,
        最大: `¥${Math.max(...amounts).toFixed(2)}`,
        最小: `¥${Math.min(...amounts).toFixed(2)}`
      });

      const typeStats = knowledgeBase.metadata.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});
      console.log(' 类型统计:', typeStats);
    }

    console.log('');

    // 2. AI模型状态
    console.log('AI模型状态:');
    console.log('  - TensorFlow.js:', localAIModelReady ? ' 已就绪' : ' 加载中');
    console.log('  - 模型类型:', 'Universal Sentence Encoder');
    console.log('  - 向量维度:', '768维语义向量');
    console.log('  - 支持问题类型:', ['支出分析', '收入分析', '趋势分析', '预算建议', '统计查询']);

    console.log('');

    // 3. 处理状态
    console.log(' 处理状态:');
    console.log('  - Web Worker加载:', workerLoading ? ' 处理中' : ' 空闲');
    console.log('  - 数据可用性:', hasData ? '有数据' : ' 无数据');
    console.log('  - 重试可用:', canRetry ? '可重试' : '不可重试');
    console.log('  - 数据总量:', billList?.length || 0, '条');

    console.log('');

    // 4. 最新搜索和问答结果
    console.log(' 最新搜索结果:');
    if (searchResults?.length > 0) {
      console.log('  - 搜索到', searchResults.length, '条相关记录');
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`  - [${index + 1}] ${result.category}: ¥${result.amount} (${result.similarity ? (result.similarity * 100).toFixed(1) + '%' : '相似度未知'})`);
      });
    } else {
      console.log('  - 无搜索结果');
    }

    console.log('');

    console.log(' 问答历史:');
    if (vectorAnswers?.length > 0) {
      vectorAnswers.slice(0, 2).forEach((answer, index) => {
        console.log(`  - [${index + 1}] Q: ${answer.question.substring(0, 30)}...`);
        console.log(`         A: ${answer.answer.substring(0, 50)}... (${answer.confidence ? (answer.confidence * 100).toFixed(1) + '%信心' : ''})`);
      });
    } else {
      console.log('  - 无问答历史');
    }

    console.log('');
    console.log('系统就绪状态:', knowledgeBase && localAIModelReady ? '✅ 完全就绪，可以开始智能问答' : '⏳ 系统初始化中');

    ;
  }, [knowledgeBase, localAIModelReady, workerLoading, hasData, canRetry, billList, searchResults, vectorAnswers]);

  // 查询具体月份数据
  const querySpecificMonth = async (year, month) => {
    const billList = processedData || [];

    console.log(`查询 ${year}年${month}月数据，原始数据量:`, billList.length);

    const monthBills = billList.filter(bill => {
      // 检查账单数据是否有效
      if (!bill || typeof bill !== 'object') {
        console.warn(' 发现无效账单对象:', bill);
        return false;
      }

      if (!bill.date) {
        console.warn('账单缺少日期字段:', bill);
        return false;
      }

      const billDate = new Date(bill.date);
      if (isNaN(billDate.getTime())) {
        console.warn(' 账单日期无效:', bill.date, bill);
        return false;
      }

      const matches = billDate.getFullYear() === year && (billDate.getMonth() + 1) === month;
      if (matches) {
        console.log(`匹配账单: ${bill.date} - ${bill.category} - ¥${bill.money}`);
      }

      return matches;
    });

    console.log(`找到 ${monthBills.length} 条 ${year}年${month}月账单`);

    if (monthBills.length === 0) {
      return null;
    }

    // 计算月份汇总（只处理有效账单）
    const validMonthBills = monthBills.filter(bill =>
      bill &&
      typeof bill === 'object' &&
      typeof bill.money === 'number' &&
      !isNaN(bill.money)
    );

    console.log(`有效月份账单: ${validMonthBills.length}/${monthBills.length}`);

    const summary = validMonthBills.reduce((acc, bill) => {
      const amount = Math.abs(bill.money);
      if (bill.money > 0) {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      acc.count++;
      return acc;
    }, { income: 0, expense: 0, count: 0 });

    console.log(`返回月份数据: ${validMonthBills.length}条有效账单`);

    return {
      ...summary,
      bills: validMonthBills, // 只返回有效账单
      year,
      month,
      category: '月份汇总',
      type: 'month_summary',
      date: `${year}-${month.toString().padStart(2, '0')}`,
      description: `${year}年${month}月账单汇总`
    };
  };

  const handleReset = () => {
    setVectorQuestion('');
    setVectorAnswers([]);
    setVectorSearchResults(null);
    setFeedbackRatings({});
    setFeedbackComments({});
  };

  // 提交用户反馈
  const submitFeedback = async (answerId, rating, comments = '') => {
    try {
      // 找到对应的回答
      const answer = vectorAnswers.find(a => a.id === answerId || a.timestamp === answerId);
      if (!answer) return;

      // 构建分析结果对象（用于反馈学习）
      const analysisResult = {
        type: answer.type || 'general',
        confidence: answer.confidence,
        analysis: {
          summary: answer.searchResults ? {
            expenseCount: answer.searchResults.length,
            totalExpense: answer.searchResults.reduce((sum, r) => sum + Math.abs(r.amount || 0), 0)
          } : null,
          insights: [answer.answer],
          recommendations: []
        }
      };

      // 提交反馈到AI模型
      await tensorflowAIModel.collectUserFeedback(analysisResult, rating / 5, comments);

      // 更新本地状态
      setFeedbackRatings(prev => ({ ...prev, [answerId]: rating }));
      setFeedbackComments(prev => ({ ...prev, [answerId]: comments }));

      Toast.show('感谢您的反馈！这将帮助我们改进AI分析质量');
    } catch (error) {
      console.error('提交反馈失败:', error);
      Toast.show('反馈提交失败，请稍后重试');
    }
  };

  // 构建向量知识库
  const handleBuildVectorKnowledgeBase = async () => {
    if (!hasData) {
      Toast.show('没有可处理的账单数据');
      return;
    }

    try {
      console.log(' 开始构建向量知识库...');
      console.log(' 当前账单数据:', billList);
      console.log(' 账单数量:', billList?.length || 0);
      console.log(' hasData状态:', hasData);
      console.log(' processedData:', processedData);
      console.log('processedData长度:', processedData?.length || 0);

      await buildVectorKnowledgeBase();
      Toast.show('向量知识库构建完成');

      // 延迟一下等待状态更新，然后打印详细状态
      setTimeout(() => {
        console.log('📊 向量知识库构建完成 - 详细状态:');
        console.log('✅ 知识库对象:', knowledgeBase);
        console.log('📈 元数据数量:', knowledgeBase?.metadata?.length || 0);
        console.log('🎯 向量维度:', knowledgeBase?.dimensions || 0);

        if (knowledgeBase?.metadata) {
          const categoryStats = knowledgeBase.metadata.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {});
          console.log('类别统计:', categoryStats);

          const dates = knowledgeBase.metadata.map(item => new Date(item.date).getTime());
          const startDate = new Date(Math.min(...dates)).toLocaleDateString();
          const endDate = new Date(Math.max(...dates)).toLocaleDateString();
          console.log('时间范围:', `${startDate} - ${endDate}`);

          const totalAmount = knowledgeBase.metadata.reduce((sum, item) => sum + item.amount, 0);
          const avgAmount = totalAmount / knowledgeBase.metadata.length;
          console.log('金额统计:', {
            总数: totalAmount.toFixed(2),
            平均: avgAmount.toFixed(2),
            最大: Math.max(...knowledgeBase.metadata.map(item => item.amount)).toFixed(2),
            最小: Math.min(...knowledgeBase.metadata.map(item => item.amount)).toFixed(2)
          });
        }

        console.log('向量数组长度:', knowledgeBase?.vectors?.length || 0);
        console.log(' AI模型状态:', localAIModelReady ? '就绪' : '未就绪');
        console.log('构建成功！可以开始智能问答了。');

        // 自动打印完整系统状态
        printSystemStatus();
      }, 500);

    } catch (error) {
      console.error('向量知识库构建失败:', error);
      Toast.show(`构建失败: ${error.message}`);
    }
  };

  // 处理向量问答
  const handleVectorQA = async () => {
    if (!vectorQuestion.trim()) {
      Toast.show('请输入问题');
      return;
    }

    if (!localAIModelReady) {
      Toast.show('TensorFlow.js AI模型尚未准备就绪，请稍等');
      return;
    }

    try {
      console.log('开始处理向量问答...');
      console.log('用户问题:', vectorQuestion);

      // 检查是否是具体月份查询
      const yearMonthMatch = vectorQuestion.match(/(\d{4})年(\d{1,2})月/);
      if (yearMonthMatch) {
        console.log('检测到具体月份查询，切换到月份分析模式');
        const targetYear = parseInt(yearMonthMatch[1]);
        const targetMonth = parseInt(yearMonthMatch[2]);

        try {
          // 获取具体月份数据
          const monthData = await querySpecificMonth(targetYear, targetMonth);

          if (monthData) {
            console.log(' 找到月份数据，开始分析');
            console.log('月份数据详情:', {
              totalBills: monthData.bills.length,
              income: monthData.income,
              expense: monthData.expense,
              year: monthData.year,
              month: monthData.month
            });

            // 验证账单数据格式
            console.log('验证账单数据格式...');
            const validBills = monthData.bills.filter(bill => bill && typeof bill === 'object' && typeof bill.money === 'number');
            const invalidBills = monthData.bills.filter(bill => !bill || typeof bill !== 'object' || typeof bill.money !== 'number');

            console.log(` 有效账单: ${validBills.length}, 无效账单: ${invalidBills.length}`);

            if (invalidBills.length > 0) {
              console.error('发现无效账单数据:', invalidBills.slice(0, 3)); // 只显示前3个
            }

            if (validBills.length === 0) {
              console.error('没有有效账单数据，停止分析');
              const newAnswer = {
                question: vectorQuestion,
                answer: `很抱歉，找到的月份数据格式无效，无法进行分析。`,
                confidence: 0.5,
                timestamp: new Date().toISOString(),
                type: 'data_error'
              };
              setVectorAnswers(prev => [newAnswer, ...prev]);
              setVectorQuestion('');
              return;
            }

            // 只使用有效账单
            const cleanMonthData = {
              ...monthData,
              bills: validBills
            };

            console.log(`清理后的数据: ${validBills.length}条有效账单`);

            // 使用清理后的月份数据生成回答
            const formattedSearchResults = cleanMonthData.bills.map(bill => ({
              bill: bill,  // 包装成预期的格式
              similarity: 1.0, // 月份查询都是完全匹配
              category: bill.category,
              amount: Math.abs(bill.money)
            }));

            const aiResponse = await generateTensorFlowResponse(vectorQuestion, {
              searchResults: formattedSearchResults, // 传递格式化的搜索结果
              query: vectorQuestion,
              knowledgeBase,
              isSpecificMonth: true // 标记为具体月份查询
            });

            const newAnswer = {
              question: vectorQuestion,
              answer: aiResponse.response,
              confidence: aiResponse.confidence,
              timestamp: new Date().toISOString(),
              type: 'specific_month'
            };

            setVectorAnswers(prev => [newAnswer, ...prev]);
            setVectorQuestion('');
            console.log(' 月份分析完成');
            return;
          } else {
            console.log('未找到月份数据');
            const newAnswer = {
              question: vectorQuestion,
              answer: `很抱歉，在账单记录中未找到 ${targetYear}年${targetMonth}月 的相关数据。\n\n可能的原因：\n- 该月份没有消费记录\n- 数据尚未录入\n- 请检查日期格式是否正确`,
              confidence: 0.8,
              timestamp: new Date().toISOString(),
              type: 'no_data'
            };

            setVectorAnswers(prev => [newAnswer, ...prev]);
            setVectorQuestion('');
            return;
          }
        } catch (error) {
          console.error('月份数据查询失败:', error);
          Toast.show(`月份查询失败: ${error.message}`);
          return;
        }
      }

      // 检查是否需要向量知识库
      if (!knowledgeBase) {
        Toast.show('请先构建向量知识库');
        return;
      }

      // 1. 执行向量搜索
      console.log(' 执行向量搜索...');

      // 根据查询类型调整搜索结果数量
      let searchTopK = 15; // 默认15条
      const queryLower = vectorQuestion.toLowerCase();

      // 年份查询：返回更多数据以确保统计完整性
      if (/\d{4}年/.test(queryLower)) {
        searchTopK = 50; // 年份查询返回更多数据
        console.log(' 检测到年份查询，增加搜索结果数量到50条');
      }
      // 统计查询：返回更多数据
      else if (queryLower.includes('统计') || queryLower.includes('分析') || queryLower.includes('汇总')) {
        searchTopK = 30; // 统计查询返回更多数据
        console.log('检测到统计查询，增加搜索结果数量到30条');
      }

      const currentSearchResults = await vectorSearch(vectorQuestion, searchTopK);
      console.log(`向量搜索返回结果: ${currentSearchResults?.length || 0}条 (topK=${searchTopK})`, currentSearchResults);
      console.log('结果类型:', typeof currentSearchResults);
      console.log('结果长度:', currentSearchResults?.length || 0);

      setVectorSearchResults(currentSearchResults);
      console.log('✅ 状态已更新，找到', currentSearchResults?.length || 0, '条相关记录');
      console.log('📋 搜索结果详情:', currentSearchResults);

      // 2. 生成问答prompt
      console.log('生成问答提示...');
      const qaPrompt = await generateVectorQAPrompt(vectorQuestion, {
        searchResults: currentSearchResults,
        timestamp: Date.now()
      });
      console.log('生成的问答提示:', qaPrompt);

      // 3. 使用TensorFlow.js生成智能回答
      console.log(' 使用TensorFlow.js生成智能回答...');
      const aiResponse = await generateTensorFlowResponse(vectorQuestion, {
        searchResults: currentSearchResults,
        query: vectorQuestion,
        knowledgeBase
      });
      console.log('🎯 AI回答结果:', aiResponse);

      // 4. 保存回答
      const newAnswer = {
        id: Date.now(),
        question: vectorQuestion,
        answer: aiResponse.response,
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        searchResults,
        timestamp: new Date().toLocaleString()
      };

      setVectorAnswers(prev => [newAnswer, ...prev]);
      setVectorQuestion('');

      Toast.show('问答完成');

    } catch (error) {
      console.error('向量问答失败:', error);
      Toast.show(`问答失败: ${error.message}`);
    }
  };


  return (
    <div className="ai-analyse-page">
      <h1>AI 账单分析</h1>

      <section className="panel vector-qa-section">
        <div className="panel-header">
          <h2>基于向量知识库的问答</h2>
          <span>使用本地AI模型进行智能问答</span>
        </div>

            <div className="vector-controls">
              <div className="knowledge-base-status">
                <span>知识库状态: {knowledgeBase ? ' 已构建' : '❌ 未构建'}</span>
                <span>AI模型: {localAIModelReady ? '✅ TensorFlow.js已就绪' : '⏳ TensorFlow.js加载中'}</span>
              </div>

              {!knowledgeBase && (
                <Button
                  color="primary"
                  onClick={handleBuildVectorKnowledgeBase}
                  loading={workerLoading}
                  disabled={!hasData}
                >
                  构建向量知识库
                </Button>
              )}

              {knowledgeBase && (
                <div className="qa-controls">
                  <Input
                    placeholder="询问关于账单的任何问题..."
                    value={vectorQuestion}
                    onChange={setVectorQuestion}
                    clearable
                  />
                  <Button
                    color="primary"
                    onClick={handleVectorQA}
                    loading={workerLoading}
                    disabled={!localAIModelReady}
                  >
                    智能问答
                  </Button>
                </div>
              )}
            </div>

            {/* 知识库统计信息 */}
            {knowledgeBase && (
              <div className="knowledge-base-stats">
                <h3>知识库统计</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="label">总记录数</span>
                    <span className="value">{knowledgeBase.metadata?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">向量维度</span>
                    <span className="value">{knowledgeBase.dimensions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">类别数量</span>
                    <span className="value">
                      {new Set(knowledgeBase.metadata?.map(item => item.category)).size || 0}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="label">时间范围</span>
                    <span className="value">
                      {knowledgeBase.metadata?.length ?
                        `${Math.min(...knowledgeBase.metadata.map(item => new Date(item.date).getTime())) === Infinity ? '无' :
                          new Date(Math.min(...knowledgeBase.metadata.map(item => new Date(item.date).getTime()))).toLocaleDateString()} - 
                         ${new Date(Math.max(...knowledgeBase.metadata.map(item => new Date(item.date).getTime()))).toLocaleDateString()}`
                        : '无'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {vectorAnswers.length > 0 && (
              <div className="qa-history">
                <h3>问答历史</h3>
                {vectorAnswers.map((item, index) => (
                  <Card key={item.timestamp || index} className="qa-item">
                    <div className="qa-question">
                      <strong>问：</strong>{item.question}
                    </div>
                    <div className="qa-answer">
                      <strong>答：</strong>
                      <div className="answer-content">{item.answer}</div>
                      <div className="answer-meta">
                        <span>置信度: {(item.confidence * 100).toFixed(1)}%</span>
                        <span>时间: {item.timestamp}</span>
                      </div>

                      {/* 用户反馈界面 */}
                      <div className="feedback-section">
                        <div className="feedback-rating">
                          <span>请为这个回答评分：</span>
                          <Rate
                            value={feedbackRatings[item.timestamp || item.id] || 0}
                            onChange={(rating) => {
                              const answerId = item.timestamp || item.id;
                              const currentComments = feedbackComments[answerId] || '';
                              submitFeedback(answerId, rating, currentComments);
                            }}
                            count={5}
                            allowClear={false}
                          />
                        </div>

                        {feedbackRatings[item.timestamp || item.id] && (
                          <div className="feedback-comments">
                            <Input
                              placeholder="可选：留下您的反馈意见..."
                              value={feedbackComments[item.timestamp || item.id] || ''}
                              onChange={(value) => {
                                setFeedbackComments(prev => ({
                                  ...prev,
                                  [item.timestamp || item.id]: value
                                }));
                              }}
                              onBlur={() => {
                                const answerId = item.timestamp || item.id;
                                const rating = feedbackRatings[answerId];
                                const comments = feedbackComments[answerId] || '';
                                if (rating) {
                                  submitFeedback(answerId, rating, comments);
                                }
                              }}
                              clearable
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {item.searchResults && item.searchResults.length > 0 && (
                      <details className="search-results">
                        <summary>相关账单记录 ({item.searchResults.length}条)</summary>
                        <div className="results-list">
                          {item.searchResults.slice(0, 5).map((result, index) => (
                            <div key={index} className="result-item">
                              <span className="category">{result.category}</span>
                              <span className="amount">¥{result.amount}</span>
                              <span className="similarity">
                                相似度: {(result.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

    </div>
  );
};

export default AiAnalyse;