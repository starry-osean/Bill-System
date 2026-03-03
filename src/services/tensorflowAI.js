/**
 * 基于TensorFlow.js的端侧AI服务
 * 使用Universal Sentence Encoder进行语义理解和智能分析
 */

import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

/**
 * TensorFlow.js 账单分析AI模型
 */
class TensorFlowAIModel {
  constructor() {
    this.isInitialized = false;
    this.model = null;
    this.encoder = null;

    // 训练数据：问题类型和对应的分析策略
    this.trainingData = {
      patterns: {
        // 问候类问题
        greeting: [
          '你好', '您好', 'hello', 'hi', '嗨', '哈喽', '早上好', '晚上好',
          '中午好', '下午好', '在吗', '在不在', '有人吗', '能听到吗'
        ],
        // 支出分析类问题
        expense: [
          '支出', '消费', '花了', '用了', '花费', '开销', '多少钱',
          '最贵', '最多', '最高', '最大', '排名', 'top', '前几'
        ],
        // 收入分析类问题
        income: [
          '收入', '挣钱', '工资', '奖金', '盈利', '进账', '收入来源',
          '赚钱', '获利', '收益'
        ],
        // 趋势分析类问题
        trend: [
          '趋势', '变化', '发展', '增长', '减少', '波动', '周期',
          '每月', '每天', '每周', '时间', '历史'
        ],
        // 预算建议类问题
        advice: [
          '建议', '推荐', '怎么做', '应该', '优化', '改善', '节约',
          '控制', '管理', '规划', '预算'
        ],
        // 消费增加建议类问题
        increase_consumption: [
          '加大', '增加', '提升', '提高', '多消费', '多花', '多花钱',
          '多消费', '增加消费', '扩大消费', '提升消费', '投资',
          '发展', '成长', '进步', '扩大', '增强', '板块'
        ],
        // 统计分析类问题
        statistics: [
          '统计', '平均', '总数', '总计', '汇总', '占比', '比例',
          '百分比', '数量', '多少', '最多', '最少', '最大', '最小',
          '最高', '最低', '排名', '前几', '去年', '今年', '上月',
          '本月', '月份', '年度', '按月', '按年', '时间', '期间',
          '合理', '合适', '正常', '平衡', '分析', '评价'
        ]
      },

      // 预定义的回答模板
      responses: {
        greeting: [
          "您好！我是您的智能账单分析助手，很高兴为您服务！",
          "你好！有什么账单相关的问题需要我帮助分析吗？",
          "嗨！我是AI账单助手，可以帮您分析收支情况、提供理财建议哦！"
        ],
        expense: [
          "根据您的支出记录，{category}类别的消费最高，为¥{amount}，占总支出的{percentage}%。",
          "您在{category}上的支出较为突出，建议适当控制预算。",
          "分析显示{category}是您的主要支出项目，平均每次消费¥{avgAmount}。"
        ],
        income: [
          "您的主要收入来源是{category}，总收入¥{amount}，占收入比例{percentage}%。",
          "收入结构相对{stability}，建议{advice}。",
          "月均收入¥{monthlyIncome}，收入来源较为{diversity}。"
        ],
        trend: [
          "支出趋势显示{period}内{change}了{percentage}%。",
          "{category}类别的消费在{period}内呈现{pattern}趋势。",
          "整体财务状况在{period}内{assessment}。"
        ],
        advice: [
          "建议您{action}，这样可以{benefit}。",
          "优化建议：{specific_advice}",
          "财务规划：{planning_suggestion}"
        ]
      }
    };

    // 账单数据特征向量缓存
    this.billEmbeddings = null;
    this.questionEmbeddings = null;

    // 用户反馈学习系统
    this.feedbackHistory = [];
    this.confidenceWeights = {
      dataQuality: 0.2,
      questionComplexity: 0.15,
      analysisDepth: 0.25,
      consistency: 0.2,
      contentQuality: 0.2
    };
    this.learningRate = 0.1;
    this.maxFeedbackHistory = 100;
  }

  /**
   * 初始化TensorFlow.js模型
   */
  async initialize() {
    try {
      console.log('🚀 初始化TensorFlow.js AI模型...');

      // 设置TensorFlow.js后端
      await tf.setBackend('webgl');
      await tf.ready();

      console.log('📦 加载Universal Sentence Encoder...');
      this.encoder = await use.load();

      console.log('🧠 初始化完成，准备进行智能分析');
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('❌ TensorFlow.js模型初始化失败:', error);
      return false;
    }
  }

  /**
   * 生成文本嵌入向量
   */
  async generateEmbeddings(texts) {
    if (!this.isInitialized || !this.encoder) {
      throw new Error('AI模型未初始化');
    }

    try {
      const embeddings = await this.encoder.embed(texts);
      return embeddings;
    } catch (error) {
      console.error('生成嵌入向量失败:', error);
      throw error;
    }
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = tf.sum(tf.mul(vecA, vecB)).dataSync()[0];
    const normA = tf.sqrt(tf.sum(tf.square(vecA))).dataSync()[0];
    const normB = tf.sqrt(tf.sum(tf.square(vecB))).dataSync()[0];
    return dotProduct / (normA * normB);
  }

  /**
   * 预处理账单数据，生成特征向量
   */
  async preprocessBillData(billList) {
    if (!billList || billList.length === 0) return;

    console.log('📊 预处理账单数据...');

    // 将账单数据转换为文本描述
    const billTexts = billList.map(bill => {
      const type = bill.money > 0 ? '收入' : '支出';
      const category = bill.category || bill.useFor || '其他';
      const amount = Math.abs(bill.money);
      const description = bill.description || '';

      return `${type} ${category} ${amount}元 ${description}`.trim();
    });

    // 生成账单数据的嵌入向量
    this.billEmbeddings = await this.generateEmbeddings(billTexts);

    // 存储原始账单数据用于后续分析
    this.processedBills = billList.map((bill, index) => ({
      ...bill,
      text: billTexts[index],
      embeddingIndex: index
    }));

    console.log(`✅ 已处理 ${billList.length} 条账单记录`);
  }

  /**
   * 分析问题类型
   */
  async classifyQuestion(question) {
    if (!question || !this.encoder) {
      return 'general';
    }

    try {
      const trimmedQuestion = question.trim().toLowerCase();

      // 优先检查是否是统计类问题（包含多个统计关键词）
      const statisticsKeywords = ['统计', '平均', '总数', '总计', '汇总', '占比', '比例',
        '百分比', '数量', '多少', '最多', '最少', '最大', '最小',
        '最高', '最低', '排名', '前几', '去年', '今年', '上月',
        '本月', '月份', '年度', '按月', '按年', '时间', '期间'];

      const hasMultipleStatsKeywords = statisticsKeywords.filter(keyword =>
        trimmedQuestion.includes(keyword.toLowerCase())
      ).length >= 2; // 包含2个或以上统计关键词

      if (hasMultipleStatsKeywords) {
        return 'statistics';
      }

      // 检查是否是具体月份分析问题（如"2025年10月的消费分析"）
      if (/\d{4}年\d{1,2}月/.test(trimmedQuestion)) {
        return 'statistics'; // 只要包含具体年月，就认为是统计问题
      }

      // 检查是否包含年份模式（如"2025年"）
      if (/\d{4}年/.test(trimmedQuestion) &&
          (trimmedQuestion.includes('最高') || trimmedQuestion.includes('最多') ||
           trimmedQuestion.includes('支出') || trimmedQuestion.includes('收入'))) {
        return 'statistics';
      }

      // 优先检查是否是问候语 - 使用更精确的匹配
      const greetingPatterns = this.trainingData.patterns.greeting || [];

      // 检查是否是完整的问候语（整个问题都是问候语）
      for (const pattern of greetingPatterns) {
        if (trimmedQuestion === pattern.toLowerCase()) {
          return 'greeting';
        }
      }

      // 检查是否是简单的问候语（单个词或短语）
      const simpleGreetings = ['你好', '您好', 'hello', 'hi', '嗨', '哈喽', '早上好', '晚上好', '中午好', '下午好'];
      if (simpleGreetings.some(greeting => trimmedQuestion === greeting.toLowerCase() || trimmedQuestion === `${greeting}！` || trimmedQuestion === `${greeting}!`)) {
        return 'greeting';
      }

      // 检查是否是包含问候语的短问题（不超过3个词）
      const words = trimmedQuestion.split(/\s+/);
      if (words.length <= 3) {
        for (const pattern of greetingPatterns) {
          if (words.some(word => word === pattern.toLowerCase())) {
            return 'greeting';
          }
        }
      }

      // 生成问题嵌入向量
      const questionEmbedding = await this.generateEmbeddings([question]);

      // 计算与各类问题的相似度（排除greeting类别，除非是真正的问候语）
      const similarities = {};
      const categoriesToCheck = Object.keys(this.trainingData.patterns).filter(cat => cat !== 'greeting');

      for (const category of categoriesToCheck) {
        const patterns = this.trainingData.patterns[category];
        const patternEmbeddings = await this.generateEmbeddings(patterns);
        const similaritiesForCategory = [];

        for (let i = 0; i < patternEmbeddings.shape[0]; i++) {
          const patternEmbedding = tf.slice(patternEmbeddings, [i, 0], [1, -1]);
          const similarity = this.cosineSimilarity(
            tf.squeeze(questionEmbedding),
            tf.squeeze(patternEmbedding)
          );
          similaritiesForCategory.push(similarity);
        }

        similarities[category] = Math.max(...similaritiesForCategory);
      }

      // 返回相似度最高的类别
      const bestCategory = Object.entries(similarities).reduce((max, [cat, sim]) =>
        sim > max.sim ? { category: cat, sim } : max,
        { category: 'general', sim: 0 }
      );

      return bestCategory.category;
    } catch (error) {
      console.error('问题分类失败:', error);
      return 'general';
    }
  }

  /**
   * 验证问题输入
   */
  validateQuestion(question) {
    if (!question || typeof question !== 'string') {
      return { isValid: false, reason: '输入为空或格式无效' };
    }

    const trimmed = question.trim();
    if (trimmed.length === 0) {
      return { isValid: false, reason: '输入内容为空' };
    }

    if (trimmed.length < 2) {
      return { isValid: false, reason: '输入内容过短' };
    }

    // 检查是否包含明显的乱码或无意义字符
    const nonsensePatterns = [
      /^[^\u4e00-\u9fa5a-zA-Z0-9]+$/, // 只有特殊字符
      /(.)\1{3,}/, // 连续重复字符
      /^[a-zA-Z]{1,2}(\s*[a-zA-Z]{1,2})*$/, // 只有单个字母单词
      /[^\u4e00-\u9fa5a-zA-Z0-9\s]{3,}/, // 过多特殊字符
    ];

    for (const pattern of nonsensePatterns) {
      if (pattern.test(trimmed)) {
        return { isValid: false, reason: '输入内容似乎不是有效的财务问题' };
      }
    }

    // 检查是否包含财务相关关键词
    const financeKeywords = [
      '账', '钱', '收', '支', '出', '入', '费', '用', '花', '挣', '赚',
      '工资', '收入', '支出', '消费', '预算', '投资', '理财', '财务',
      '银行', '卡', '现金', '余额', '结余', '统计', '分析', '趋势',
      '建议', '节约', '控制', '增加', '减少', '多少', '平均', '总共'
    ];

    const hasFinanceKeyword = financeKeywords.some(keyword =>
      trimmed.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasFinanceKeyword && trimmed.length > 10) {
      return { isValid: false, reason: '输入内容似乎与财务管理无关，请输入账单分析相关问题' };
    }

    return { isValid: true };
  }

  /**
   * 智能分析账单数据
   */
  async analyzeBills(question, billList) {
    if (!this.isInitialized) {
      throw new Error('AI模型未初始化');
    }

    try {
      console.log('开始智能分析...');

      // 验证问题输入
      const validation = this.validateQuestion(question);
      if (!validation.isValid) {
        console.log(`❌ 问题验证失败: ${validation.reason}`);
        return {
          type: 'invalid_input',
          analysis: {
            insights: [`❌ ${validation.reason}`],
            recommendations: ['💡 请重新输入一个关于账单或财务的问题']
          },
          confidence: 0,
          model: 'TensorFlow.js Universal Sentence Encoder'
        };
      }

      // 确保账单数据已预处理
      if (!this.billEmbeddings || this.processedBills !== billList) {
        await this.preprocessBillData(billList);
      }

      // 分类问题类型
      const questionType = await this.classifyQuestion(question);
      console.log(`📋 问题类型: ${questionType}`);

      // 特殊处理问候语类型
      if (questionType === 'greeting') {
        const greetingResponse = this.trainingData.responses.greeting[
          Math.floor(Math.random() * this.trainingData.responses.greeting.length)
        ];
        return {
          type: 'greeting',
          analysis: {
            summary: { greeting: true },
            insights: [greetingResponse],
            recommendations: ['如果您有账单相关的问题，请随时询问！']
          },
          confidence: 0.9,
          model: 'TensorFlow.js Universal Sentence Encoder'
        };
      }

      // 根据问题类型进行不同分析
      const analysis = await this.performAnalysis(question, questionType, billList);

      return {
        type: questionType,
        analysis,
        confidence: this.calculateConfidence(analysis, question, billList),
        model: 'TensorFlow.js Universal Sentence Encoder'
      };

    } catch (error) {
      console.error('账单分析失败:', error);
      return {
        type: 'error',
        analysis: '分析过程中出现错误，请稍后重试',
        confidence: 0,
        model: 'TensorFlow.js'
      };
    }
  }

  /**
   * 执行具体分析
   */
  async performAnalysis(question, type, billList) {
    const analysis = {
      summary: {},
      insights: [],
      recommendations: []
    };

    // 计算基础统计
    const stats = this.calculateBillStatistics(billList);
    analysis.summary = stats;

    switch (type) {
      case 'greeting':
        // 问候语不需要复杂的账单分析，只返回简单的问候信息
        analysis.insights = ['您好！我是智能账单分析助手，很高兴为您服务！'];
        analysis.recommendations = ['如果您有关于账单分析的问题，请随时询问！'];
        break;

      case 'expense':
        analysis.insights = this.analyzeExpenses(billList, stats);
        analysis.recommendations = this.generateExpenseRecommendations(stats);
        break;

      case 'income':
        analysis.insights = this.analyzeIncome(billList, stats);
        analysis.recommendations = this.generateIncomeRecommendations(stats);
        break;

      case 'trend':
        analysis.insights = this.analyzeTrends(billList, stats);
        analysis.recommendations = this.generateTrendRecommendations(stats);
        break;

      case 'advice':
        analysis.insights = this.analyzeOverall(billList, stats);
        analysis.recommendations = this.generateComprehensiveAdvice(stats);
        break;

      case 'increase_consumption':
        analysis.insights = this.analyzeConsumptionOpportunities(billList, stats);
        analysis.recommendations = this.generateIncreaseConsumptionAdvice(stats);
        break;

      case 'statistics':
        analysis.insights = this.generateStatistics(billList, stats, question);
        break;

      default:
        analysis.insights = this.generateGeneralAnalysis(billList, stats, question);
        analysis.recommendations = this.generateGeneralRecommendations(stats);
    }

    return analysis;
  }

  /**
   * 计算账单统计信息
   */
  calculateBillStatistics(billList) {
    const expenses = billList.filter(bill => bill.money < 0);
    const incomes = billList.filter(bill => bill.money > 0);

    const totalExpense = expenses.reduce((sum, bill) => sum + Math.abs(bill.money), 0);
    const totalIncome = incomes.reduce((sum, bill) => sum + bill.money, 0);

    // 按类别分组
    const expenseByCategory = {};
    const incomeByCategory = {};

    expenses.forEach(bill => {
      const category = bill.category || bill.useFor || '其他';
      expenseByCategory[category] = (expenseByCategory[category] || 0) + Math.abs(bill.money);
    });

    incomes.forEach(bill => {
      const category = bill.category || bill.useFor || '其他';
      incomeByCategory[category] = (incomeByCategory[category] || 0) + bill.money;
    });

    // 找出最大类别
    const topExpenseCategory = Object.entries(expenseByCategory)
      .reduce((max, [cat, amount]) => amount > max.amount ? { category: cat, amount } : max,
              { category: '无', amount: 0 });

    const topIncomeCategory = Object.entries(incomeByCategory)
      .reduce((max, [cat, amount]) => amount > max.amount ? { category: cat, amount } : max,
              { category: '无', amount: 0 });

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      topExpenseCategory,
      topIncomeCategory,
      expenseByCategory,
      incomeByCategory,
      avgExpense: expenses.length > 0 ? totalExpense / expenses.length : 0,
      avgIncome: incomes.length > 0 ? totalIncome / incomes.length : 0
    };
  }

  /**
   * 支出分析
   */
  analyzeExpenses(billList, stats) {
    const insights = [];

    if (stats.topExpenseCategory.category !== '无') {
      const percentage = ((stats.topExpenseCategory.amount / stats.totalExpense) * 100).toFixed(1);
      insights.push(`💰 主要支出类别：${stats.topExpenseCategory.category}（¥${stats.topExpenseCategory.amount.toFixed(2)}，占${percentage}%）`);
    }

    insights.push(`📊 平均每次支出：¥${stats.avgExpense.toFixed(2)}`);
    insights.push(`📈 支出笔数：${stats.expenseCount}笔`);

    // 分析支出分布
    const categories = Object.entries(stats.expenseByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (categories.length > 0) {
      insights.push(`🎯 支出Top3：${categories.map(([cat, amount]) => `${cat}¥${amount.toFixed(0)}`).join('、')}`);
    }

    return insights;
  }

  /**
   * 收入分析
   */
  analyzeIncome(billList, stats) {
    const insights = [];

    if (stats.topIncomeCategory.category !== '无') {
      const percentage = ((stats.topIncomeCategory.amount / stats.totalIncome) * 100).toFixed(1);
      insights.push(`💵 主要收入来源：${stats.topIncomeCategory.category}（¥${stats.topIncomeCategory.amount.toFixed(2)}，占${percentage}%）`);
    }

    insights.push(`📈 平均每次收入：¥${stats.avgIncome.toFixed(2)}`);
    insights.push(`💼 收入笔数：${stats.incomeCount}笔`);

    const incomeStability = stats.incomeCount > 1 ? '相对稳定' : '收入来源单一';
    insights.push(`📊 收入稳定性：${incomeStability}`);

    return insights;
  }

  /**
   * 趋势分析
   */
  analyzeTrends(billList, stats) {
    const insights = [];

    const ratio = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome * 100).toFixed(1) : 0;
    insights.push(`📊 收支比：支出占收入的${ratio}%`);

    if (stats.balance > 0) {
      insights.push(`💚 财务状况：收支平衡，有¥${stats.balance.toFixed(2)}盈余`);
    } else {
      insights.push(`⚠️ 财务状况：支出超出收入¥${Math.abs(stats.balance).toFixed(2)}`);
    }

    insights.push(`💰 总结：总收入¥${stats.totalIncome.toFixed(2)}，总支出¥${stats.totalExpense.toFixed(2)}`);

    return insights;
  }

  /**
   * 整体分析
   */
  analyzeOverall(billList, stats) {
    const insights = [];

    insights.push(`📊 财务概况：收入¥${stats.totalIncome.toFixed(2)}，支出¥${stats.totalExpense.toFixed(2)}，结余¥${stats.balance.toFixed(2)}`);

    if (stats.balance > 0) {
      insights.push(`💚 财务健康度：良好，有正结余`);
    } else {
      insights.push(`⚠️ 财务健康度：需要关注，支出大于收入`);
    }

    const savingsRate = stats.totalIncome > 0 ? ((stats.balance / stats.totalIncome) * 100).toFixed(1) : 0;
    insights.push(`💰 储蓄率：${savingsRate}%`);

    return insights;
  }

  /**
   * 生成统计信息
   */
  /**
   * 计算每月统计数据
   *  billList - 账单列表
   *  targetYear - 目标年份（可选）
   */
  calculateMonthlyStatistics(billList, targetYear = null) {
    const monthlyData = {};

    // 按月份分组统计
    billList.forEach(bill => {
      const date = new Date(bill.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // 如果指定了年份，只统计该年份的数据
      if (targetYear && year !== targetYear) {
        return;
      }

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          year,
          month: `${month}月`,
          income: 0,
          expense: 0,
          count: 0
        };
      }

      monthlyData[monthKey].count++;

      if (bill.type === 'income' || bill.money > 0) {
        monthlyData[monthKey].income += Math.abs(bill.money);
      } else {
        monthlyData[monthKey].expense += Math.abs(bill.money);
      }
    });

    // 转换为数组并排序
    return Object.values(monthlyData).sort((a, b) => {
      // 按年月排序
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return parseInt(a.month) - parseInt(b.month);
    });
  }

  /**
   * 分析消费合理性
   * @param {Array} monthlyStats - 月份统计数据
   */
  analyzeConsumptionReasonableness(monthlyStats) {
    if (!monthlyStats || monthlyStats.length === 0) {
      return { best: null, all: [], avgIncome: 0 };
    }

    // 计算平均收入（排除收入为0的月份）
    const validMonths = monthlyStats.filter(month => month.income > 0);
    const avgIncome = validMonths.length > 0
      ? validMonths.reduce((sum, month) => sum + month.income, 0) / validMonths.length
      : monthlyStats.reduce((sum, month) => sum + month.income, 0) / monthlyStats.length;

    // 为每个月计算合理性评分
    const scoredMonths = monthlyStats.map(month => {
      let score = 10; // 满分10分
      let reasons = [];

      const balance = month.income - month.expense;
      const expenseRatio = month.income > 0 ? (month.expense / month.income) * 100 : 100;

      // 支出占比评分（理想60-80%）
      if (expenseRatio >= 60 && expenseRatio <= 80) {
        score += 2; // 理想范围加分
        reasons.push('支出占比适中');
      } else if (expenseRatio > 80 && expenseRatio <= 100) {
        score -= 1; // 偏高扣分
        reasons.push('支出占比偏高');
      } else if (expenseRatio > 100) {
        score -= 3; // 超支严重扣分
        reasons.push('支出超出收入');
      } else if (expenseRatio < 60) {
        score -= 1; // 支出过低也扣分（可能表示数据不完整）
        reasons.push('支出占比偏低');
      }

      // 结余评分
      if (balance > 0) {
        score += 2; // 有结余加分
        reasons.push('有正结余');
      } else if (balance === 0) {
        score += 1; // 收支平衡
        reasons.push('收支平衡');
      } else {
        score -= 2; // 负结余扣分
        reasons.push('负结余');
      }

      // 与平均收入比较
      const incomeDiff = Math.abs(month.income - avgIncome) / avgIncome;
      if (incomeDiff < 0.2) { // 收入波动小于20%
        score += 1;
        reasons.push('收入稳定');
      }

      // 确保评分在0-10范围内
      score = Math.max(0, Math.min(10, score));

      return {
        ...month,
        balance,
        expenseRatio,
        score,
        reason: reasons.join('，')
      };
    });

    // 找出最合理的月份（评分最高）
    const bestMonth = scoredMonths.reduce((best, month) =>
      month.score > best.score ? month : best, scoredMonths[0]);

    return {
      best: bestMonth,
      all: scoredMonths.sort((a, b) => b.score - a.score), // 按评分降序排序
      avgIncome
    };
  }

  /**
   * 获取特定月份的数据
   * @param {Array} billList - 账单列表
   * @param {number} year - 年份
   * @param {number} month - 月份
   */
  getSpecificMonthData(billList, year, month) {
    const monthData = billList.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate.getFullYear() === year && (billDate.getMonth() + 1) === month;
    });

    if (monthData.length === 0) {
      return null;
    }

    // 计算该月的汇总数据
    const summary = monthData.reduce((acc, bill) => {
      const amount = Math.abs(bill.money);
      if (bill.type === 'income' || bill.money > 0) {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      acc.count++;
      return acc;
    }, { income: 0, expense: 0, count: 0 });

    // 按类别统计支出
    const categoryStats = monthData
      .filter(bill => bill.type !== 'income' && bill.money < 0)
      .reduce((acc, bill) => {
        const category = bill.category || bill.useFor || '其他';
        const amount = Math.abs(bill.money);
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += amount;
        acc[category].count++;
        return acc;
      }, {});

    return {
      ...summary,
      bills: monthData,
      categories: Object.entries(categoryStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
    };
  }

  /**
   * 分析特定月份的数据并给出意见
   * @param {Object} monthData - 月份数据
   * @param {number} year - 年份
   * @param {number} month - 月份
   * @param {string} question - 原始问题
   */
  analyzeSpecificMonth(monthData, year, month, question) {
    const { income, expense, count, categories } = monthData;
    const balance = income - expense;
    const expenseRatio = income > 0 ? (expense / income) * 100 : 100;

    const insights = [
      `📊 ${year}年${month}月消费分析：`,
      `  - 总收入：¥${income.toFixed(2)}`,
      `  - 总支出：¥${expense.toFixed(2)}`,
      `  - 净结余：¥${balance.toFixed(2)}`,
      `  - 交易笔数：${count}`,
      `  - 支出占比：${expenseRatio.toFixed(1)}%`
    ];

    // 支出类别分析
    if (categories.length > 0) {
      insights.push('', '💰 支出构成（前3类）：');
      categories.slice(0, 3).forEach((cat, index) => {
        const percentage = expense > 0 ? (cat.amount / expense * 100).toFixed(1) : 0;
        insights.push(`  - ${cat.name}：¥${cat.amount.toFixed(2)} (${percentage}%，${cat.count}笔)`);
      });
    }

    // 给出合理意见
    const opinions = ['', '💡 消费分析意见：'];

    // 支出占比分析
    if (expenseRatio > 80) {
      opinions.push('⚠️ 支出占比过高，建议控制消费，留出更多结余');
    } else if (expenseRatio < 60) {
      opinions.push('✅ 支出控制良好，结余充足');
    } else {
      opinions.push('✅ 支出占比适中，消费结构合理');
    }

    // 结余分析
    if (balance < 0) {
      opinions.push('🚨 本月支出超出收入，建议制定预算控制计划');
    } else if (balance > income * 0.2) {
      opinions.push('✅ 结余丰厚，建议合理规划结余资金');
    } else {
      opinions.push('✅ 结余适中，财务状况健康');
    }

    // 消费集中度分析
    if (categories.length > 0) {
      const topCategoryRatio = categories[0].amount / expense;
      if (topCategoryRatio > 0.5) {
        opinions.push(`⚠️ ${categories[0].name}支出占比过高${(topCategoryRatio * 100).toFixed(1)}%，建议分散消费`);
      }
    }

    // 交易频率分析
    const avgTransaction = count > 0 ? expense / count : 0;
    if (avgTransaction > 200) {
      opinions.push('💰 单笔平均支出较高，建议关注大额消费');
    } else if (count > 20) {
      opinions.push('📈 交易频率较高，建议定期检查消费习惯');
    }

    return [...insights, ...opinions];
  }

  generateStatistics(billList, stats, question = '') {
    const questionLower = question.toLowerCase();

    // 检查是否是关于月份/时间的问题
    if (questionLower.includes('月份') || questionLower.includes('最多') || questionLower.includes('最少') ||
        questionLower.includes('去年') || questionLower.includes('今年') || questionLower.includes('按月') ||
        /\d{4}年/.test(questionLower) || /\d{4}年\d{1,2}月/.test(questionLower)) {  // 匹配年份和具体月份

      // 提取年份和月份（如果指定了具体月份）
      let targetYear = null;
      let targetMonth = null;

      const yearMonthMatch = questionLower.match(/(\d{4})年(\d{1,2})月/);
      if (yearMonthMatch) {
        targetYear = parseInt(yearMonthMatch[1]);
        targetMonth = parseInt(yearMonthMatch[2]);
      } else {
        // 只提取年份
        const yearMatch = questionLower.match(/(\d{4})年/);
        if (yearMatch) {
          targetYear = parseInt(yearMatch[1]);
        }
      }

      // 如果是具体月份分析，提取该月份的数据
      if (targetYear !== null && targetMonth !== null) {
        const monthData = this.getSpecificMonthData(billList, targetYear, targetMonth);
        if (monthData) {
          return this.analyzeSpecificMonth(monthData, targetYear, targetMonth, questionLower);
        } else {
          // 返回未找到数据的提示
          return [
            `❌ 未找到数据`,
            `很抱歉，在账单记录中未找到 ${targetYear}年${targetMonth}月 的相关数据。`,
            `可能的原因：`,
            `  - 该月份没有消费记录`,
            `  - 数据尚未录入`,
            `  - 请检查日期格式是否正确`,
            '',
            `💡 建议：`,
            `  - 查看其他月份的数据`,
            `  - 检查数据导入是否完整`,
            `  - 确认查询的年月是否正确`
          ];
        }
      }

      // 按月份统计支出
      const monthlyStats = this.calculateMonthlyStatistics(billList, targetYear);

      if (questionLower.includes('最多') || questionLower.includes('最大') || questionLower.includes('最高')) {
        // 找出支出最多的月份
        const maxExpenseMonth = monthlyStats.reduce((max, month) =>
          month.expense > max.expense ? month : max, monthlyStats[0]);

        return [
          `📈 月份支出统计：`,
          `  - 支出最多的月份：${maxExpenseMonth.month}月`,
          `  - 支出金额：¥${maxExpenseMonth.expense.toFixed(2)}`,
          `  - 收入金额：¥${maxExpenseMonth.income.toFixed(2)}`,
          `  - 净结余：¥${(maxExpenseMonth.income - maxExpenseMonth.expense).toFixed(2)}`,
          `  - 交易笔数：${maxExpenseMonth.count}`,
          '',
          `📊 其他月份对比：`,
          ...monthlyStats
            .filter(month => month !== maxExpenseMonth)
            .slice(0, 3)
            .map(month => `  - ${month.month}月：¥${month.expense.toFixed(2)}支出，¥${month.income.toFixed(2)}收入`)
        ];
      }

      if (questionLower.includes('合理') || questionLower.includes('合适') ||
          questionLower.includes('正常') || questionLower.includes('平衡')) {
        // 分析消费合理性
        const reasonableMonths = this.analyzeConsumptionReasonableness(monthlyStats);

        return [
          `⚖️ 消费合理性分析：`,
          '',
          `🎯 最合理的消费月份：`,
          `  - ${reasonableMonths.best.month}（${reasonableMonths.best.reason}）`,
          `  - 支出：¥${reasonableMonths.best.expense.toFixed(2)}`,
          `  - 收入：¥${reasonableMonths.best.income.toFixed(2)}`,
          `  - 结余：¥${reasonableMonths.best.balance.toFixed(2)}`,
          `  - 支出占比：${reasonableMonths.best.expenseRatio.toFixed(1)}%`,
          '',
          `📊 各月份消费合理性评分：`,
          ...reasonableMonths.all.map(month =>
            `  - ${month.month}：${month.score}/10分 - ${month.reason}`
          ),
          '',
          `💡 消费合理性建议：`,
          `  - 支出控制在收入的60-80%为宜`,
          `  - 保持每月有正结余`,
          `  - 避免支出波动过大`,
          `  - 建议每月结余不低于¥${reasonableMonths.avgIncome * 0.1}元`
        ];
      }

      // 默认显示所有月份统计
      if (monthlyStats.length === 0) {
        // 没有找到指定年份的数据
        const yearInfo = targetYear ? `${targetYear}年` : '';
        return [
          `❌ 未找到${yearInfo}相关数据`,
          '',
          `很抱歉，在账单记录中未找到${yearInfo}的消费记录。`,
          '',
          '可能的原因：',
          '  - 该年份没有消费记录',
          '  - 数据尚未录入',
          '  - 请检查查询的年份是否正确',
          '',
          '💡 建议：',
          '  - 查看其他年份的数据',
          '  - 检查数据导入是否完整',
          `  - 当前数据包含 ${new Date().getFullYear()} 年及之前的数据`
        ];
      }

      return [
        `📅 按月统计：`,
        ...monthlyStats.map(month =>
          `  - ${month.month}月：支出¥${month.expense.toFixed(2)}，收入¥${month.income.toFixed(2)}，结余¥${(month.income - month.expense).toFixed(2)}`
        )
      ];
    }

    // 默认统计信息
    return [
      `📊 数据统计：`,
      `  - 总收入：¥${stats.totalIncome.toFixed(2)}`,
      `  - 总支出：¥${stats.totalExpense.toFixed(2)}`,
      `  - 净结余：¥${stats.balance.toFixed(2)}`,
      `  - 交易笔数：${stats.expenseCount + stats.incomeCount}`,
      `  - 支出笔数：${stats.expenseCount}`,
      `  - 收入笔数：${stats.incomeCount}`
    ];
  }

  /**
   * 生成建议
   */
  generateExpenseRecommendations(stats) {
    const recommendations = [];

    if (stats.topExpenseCategory.amount > stats.totalExpense * 0.5) {
      recommendations.push(`⚠️ 主要支出过于集中，建议分散消费结构`);
    }

    if (stats.avgExpense > 100) {
      recommendations.push(`💡 单笔支出较大，建议控制 impulse spending`);
    }

    // 提供更智能的财务管理建议
    if (stats.balance < 0) {
      recommendations.push(`🚨 支出超出收入，建议立即制定预算控制计划`);
    } else if (stats.totalExpense > stats.totalIncome * 0.9) {
      recommendations.push(`⚠️ 支出比例较高，建议设置预算避免超支`);
    } else {
      recommendations.push(`💡 建议定期review收支，保持良好财务习惯`);
    }

    return recommendations;
  }

  generateIncomeRecommendations(stats) {
    const recommendations = [];

    if (stats.incomeCount === 1) {
      recommendations.push(`💼 收入来源单一，建议增加副业收入`);
    }

    if (stats.totalIncome > stats.totalExpense * 2) {
      recommendations.push(`💰 收入良好，建议增加储蓄和投资`);
    }

    recommendations.push(`📈 建议定期review收入来源，优化收入结构`);

    return recommendations;
  }

  generateTrendRecommendations(stats) {
    const recommendations = [];

    const ratio = stats.totalIncome > 0 ? stats.totalExpense / stats.totalIncome : 0;

    if (ratio > 0.8) {
      recommendations.push(`⚠️ 支出比例过高，建议控制在收入的70%以内`);
    }

    if (stats.balance < 0) {
      recommendations.push(`🔧 建议制定开源节流的财务计划`);
    }

    recommendations.push(`📊 建议每月跟踪收支趋势，及时调整`);

    return recommendations;
  }

  generateComprehensiveAdvice(stats) {
    const recommendations = [];

    recommendations.push(`🎯 财务规划建议：`);
    recommendations.push(`  - 设置应急基金（3-6个月生活费）`);
    recommendations.push(`  - 遵循50/30/20原则（必需/娱乐/储蓄）`);
    recommendations.push(`  - 定期投资，分散风险`);

    if (stats.balance < 0) {
      recommendations.push(`  - 立即制定还债计划`);
      recommendations.push(`  - 寻找额外的收入来源`);
    }

    return recommendations;
  }

  generateGeneralRecommendations(stats) {
    return [
      `💡 通用建议：合理规划收支，保持良好的财务习惯`,
      `📱 使用记账app跟踪日常开支`,
      `🎯 定期review财务状况，及时调整计划`
    ];
  }

  /**
   * 分析消费增长机会
   */
  analyzeConsumptionOpportunities(billList, stats) {
    const insights = [];

    insights.push(`💰 消费增长分析：`);
    insights.push(`📊 当前总支出：¥${stats.totalExpense.toFixed(2)}`);
    insights.push(`💵 可支配收入：¥${(stats.totalIncome - stats.totalExpense).toFixed(2)}`);

    // 分析未充分消费的领域
    const lowConsumptionCategories = [];
    const avgExpensePerCategory = stats.totalExpense / Object.keys(stats.expenseByCategory).length;

    Object.entries(stats.expenseByCategory).forEach(([category, amount]) => {
      if (amount < avgExpensePerCategory * 0.5) {
        lowConsumptionCategories.push(category);
      }
    });

    if (lowConsumptionCategories.length > 0) {
      insights.push(`🎯 消费潜力较大的领域：${lowConsumptionCategories.join('、')}`);
    }

    // 分析收入vs支出比例
    const savingsRate = stats.totalIncome > 0 ? ((stats.balance) / stats.totalIncome) * 100 : 0;
    if (savingsRate > 30) {
      insights.push(`💎 储蓄率较高(${savingsRate.toFixed(1)}%)，有较大消费增长空间`);
    } else if (savingsRate > 10) {
      insights.push(`📈 储蓄适中，有一定消费增长潜力`);
    } else {
      insights.push(`⚠️ 储蓄率较低，建议谨慎增加消费`);
    }

    return insights;
  }

  /**
   * 生成增加消费的建议
   */
  generateIncreaseConsumptionAdvice(stats) {
    const recommendations = [];

    // 基于财务状况给出建议
    if (stats.balance > stats.totalExpense * 0.5) {
      recommendations.push(`💪 财务状况良好，可以适当增加有益消费`);
      recommendations.push(`📚 建议投资自我提升：教育、培训、健康`);
      recommendations.push(`🏠 考虑改善居住环境或升级生活品质`);
    } else if (stats.balance > 0) {
      recommendations.push(`📈 收入稳健，可以逐步增加消费`);
      recommendations.push(`🎯 优先投资回报率高的领域`);
      recommendations.push(`💡 建立应急基金后再增加消费`);
    } else {
      recommendations.push(`⚠️ 当前财务紧张，建议先改善收支平衡`);
      recommendations.push(`🎯 聚焦高价值消费，避免低效支出`);
      return recommendations; // 提前返回，不建议增加消费
    }

    // 基于支出结构给出具体建议
    const expenseCategories = Object.keys(stats.expenseByCategory);
    const missingCategories = ['教育', '健康', '娱乐', '旅行', '投资'].filter(
      cat => !expenseCategories.some(expenseCat =>
        expenseCat.includes(cat) || cat.includes(expenseCat)
      )
    );

    if (missingCategories.length > 0) {
      recommendations.push(`🌱 建议增加对${missingCategories.slice(0, 2).join('、')}的投资`);
    }

    // 基于平均消费水平给出建议
    if (stats.avgExpense < 50) {
      recommendations.push(`📊 消费水平偏低，可以适当提升生活品质`);
    } else if (stats.avgExpense < 100) {
      recommendations.push(`💰 消费水平适中，可以考虑结构性升级`);
    } else {
      recommendations.push(`🎯 消费水平较高，建议优化消费结构`);
    }

    recommendations.push(`📋 消费增长原则：量入为出，注重长期价值`);

    return recommendations;
  }

  generateGeneralAnalysis(billList, stats, question) {
    return [
      `🤖 基于您的问题"${question}"，我来为您分析账单数据：`,
      `📊 总览：收入¥${stats.totalIncome.toFixed(2)}，支出¥${stats.totalExpense.toFixed(2)}`,
      `💰 结余：¥${stats.balance.toFixed(2)} ${stats.balance >= 0 ? '✅' : '⚠️'}`,
      `📈 交易：${billList.length}笔（收入${stats.incomeCount}笔，支出${stats.expenseCount}笔）`
    ];
  }

  /**
   * 计算置信度 - 改进版：基于多维度质量评估
   */
  calculateConfidence(analysis, question = '', billList = []) {
    let confidence = 0.3; // 降低基础置信度，从0.3开始

    // 1. 数据质量评估 (0-0.2)
    const dataQuality = this.assessDataQuality(billList);
    confidence += dataQuality * 0.2;

    // 2. 问题复杂度评估 (0-0.15)
    const questionComplexity = this.assessQuestionComplexity(question);
    confidence += (1 - questionComplexity) * 0.15; // 简单问题获得更高置信度

    // 3. 分析深度评估 (0-0.25)
    const analysisDepth = this.assessAnalysisDepth(analysis);
    confidence += analysisDepth * 0.25;

    // 4. 结果一致性评估 (0-0.2)
    const consistency = this.assessResultConsistency(analysis);
    confidence += consistency * 0.2;

    // 5. 内容质量评估 (0-0.2)
    const contentQuality = this.assessContentQuality(analysis);
    confidence += contentQuality * 0.2;

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * 收集用户反馈
   */
  collectUserFeedback(analysisResult, userRating, userComments = '') {
    if (!analysisResult || typeof userRating !== 'number') return;

    const feedback = {
      timestamp: Date.now(),
      questionType: analysisResult.type,
      predictedConfidence: analysisResult.confidence,
      userRating: Math.max(0, Math.min(1, userRating)), // 0-1范围
      userComments: userComments,
      analysis: {
        hasSummary: !!(analysisResult.analysis?.summary),
        insightCount: analysisResult.analysis?.insights?.length || 0,
        recommendationCount: analysisResult.analysis?.recommendations?.length || 0,
        dataSize: analysisResult.analysis?.summary?.expenseCount || 0
      }
    };

    // 添加到反馈历史
    this.feedbackHistory.push(feedback);

    // 限制历史记录数量
    if (this.feedbackHistory.length > this.maxFeedbackHistory) {
      this.feedbackHistory = this.feedbackHistory.slice(-this.maxFeedbackHistory);
    }

    // 触发权重调整
    this.adjustWeightsBasedOnFeedback();

    console.log(`收集到用户反馈: 预测置信度${analysisResult.confidence.toFixed(2)}, 用户评分${userRating.toFixed(2)}`);
  }

  /**
   * 基于反馈调整权重
   */
  adjustWeightsBasedOnFeedback() {
    if (this.feedbackHistory.length < 10) return; // 需要足够的历史数据

    // 计算预测准确性
    const recentFeedback = this.feedbackHistory.slice(-20); // 最近20条反馈
    const accuracyMetrics = this.calculateAccuracyMetrics(recentFeedback);

    // 根据准确性调整权重
    Object.keys(this.confidenceWeights).forEach(factor => {
      if (accuracyMetrics.factorImportance[factor]) {
        const adjustment = (accuracyMetrics.factorImportance[factor] - 0.5) * this.learningRate;
        this.confidenceWeights[factor] = Math.max(0.05, Math.min(0.4,
          this.confidenceWeights[factor] + adjustment
        ));
      }
    });

    // 归一化权重
    this.normalizeWeights();

    console.log('权重已根据用户反馈调整:', this.confidenceWeights);
  }

  /**
   * 计算准确性指标
   */
  calculateAccuracyMetrics(feedbackHistory) {
    const metrics = {
      overallAccuracy: 0,
      factorImportance: {}
    };

    // 计算整体准确性
    const confidenceErrors = feedbackHistory.map(f =>
      Math.abs(f.predictedConfidence - f.userRating)
    );
    metrics.overallAccuracy = 1 - (confidenceErrors.reduce((sum, err) => sum + err, 0) / confidenceErrors.length);

    // 分析各因子的重要性
    const factors = ['dataQuality', 'questionComplexity', 'analysisDepth', 'consistency', 'contentQuality'];

    factors.forEach(factor => {
      const factorFeedback = feedbackHistory.filter(f => {
        // 根据反馈内容判断该因子的重要性
        switch (factor) {
          case 'dataQuality':
            return f.analysis.dataSize < 10; // 小数据集时数据质量重要
          case 'questionComplexity':
            return f.userComments.toLowerCase().includes('复杂') ||
                   f.userComments.toLowerCase().includes('简单');
          case 'analysisDepth':
            return f.analysis.insightCount > 3; // 深入分析时深度重要
          case 'consistency':
            return Math.abs(f.predictedConfidence - f.userRating) > 0.3; // 大误差时一致性重要
          case 'contentQuality':
            return f.userComments.toLowerCase().includes('具体') ||
                   f.userComments.toLowerCase().includes('详细');
          default:
            return false;
        }
      });

      if (factorFeedback.length > 0) {
        const factorAccuracy = 1 - (factorFeedback.reduce((sum, f) =>
          sum + Math.abs(f.predictedConfidence - f.userRating), 0) / factorFeedback.length
        );
        metrics.factorImportance[factor] = factorAccuracy;
      }
    });

    return metrics;
  }

  /**
   * 归一化权重
   */
  normalizeWeights() {
    const totalWeight = Object.values(this.confidenceWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      Object.keys(this.confidenceWeights).forEach(factor => {
        this.confidenceWeights[factor] = this.confidenceWeights[factor] / totalWeight;
      });
    }
  }

  /**
   * 获取反馈统计
   */
  getFeedbackStatistics() {
    if (this.feedbackHistory.length === 0) {
      return {
        totalFeedback: 0,
        averageAccuracy: 0,
        recentAccuracy: 0,
        factorWeights: this.confidenceWeights
      };
    }

    const allFeedback = this.feedbackHistory;
    const recentFeedback = this.feedbackHistory.slice(-10);

    const calculateAccuracy = (feedback) => {
      const errors = feedback.map(f => Math.abs(f.predictedConfidence - f.userRating));
      return 1 - (errors.reduce((sum, err) => sum + err, 0) / errors.length);
    };

    return {
      totalFeedback: this.feedbackHistory.length,
      averageAccuracy: calculateAccuracy(allFeedback),
      recentAccuracy: calculateAccuracy(recentFeedback),
      factorWeights: { ...this.confidenceWeights },
      feedbackTrend: this.analyzeFeedbackTrend()
    };
  }

  /**
   * 分析反馈趋势
   */
  analyzeFeedbackTrend() {
    if (this.feedbackHistory.length < 5) return 'insufficient_data';

    const recent = this.feedbackHistory.slice(-5);
    const older = this.feedbackHistory.slice(-10, -5);

    if (older.length === 0) return 'improving';

    const recentAccuracy = 1 - (recent.reduce((sum, f) =>
      sum + Math.abs(f.predictedConfidence - f.userRating), 0) / recent.length);

    const olderAccuracy = 1 - (older.reduce((sum, f) =>
      sum + Math.abs(f.predictedConfidence - f.userRating), 0) / older.length);

    const improvement = recentAccuracy - olderAccuracy;

    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * 评估数据质量
   */
  assessDataQuality(billList) {
    if (!billList || billList.length === 0) return 0;

    let quality = 0;

    // 数据量评估
    const dataSize = billList.length;
    if (dataSize >= 100) quality += 0.3;      // 大量数据
    else if (dataSize >= 50) quality += 0.2;  // 中等数据量
    else if (dataSize >= 10) quality += 0.1;  // 少量数据
    // 少于10条数据不加分

    // 数据完整性评估
    const completeRecords = billList.filter(bill =>
      bill.money && bill.category && bill.date
    ).length;
    const completeness = completeRecords / dataSize;
    quality += completeness * 0.3; // 完整性权重30%

    // 时间跨度评估
    const dates = billList.map(b => new Date(b.date)).filter(d => !isNaN(d.getTime()));
    if (dates.length > 1) {
      const timeSpan = Math.max(...dates) - Math.min(...dates);
      const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
      if (daysSpan >= 180) quality += 0.2;     // 6个月以上
      else if (daysSpan >= 90) quality += 0.15; // 3个月以上
      else if (daysSpan >= 30) quality += 0.1;  // 1个月以上
    }

    // 数据多样性评估
    const categories = new Set(billList.map(b => b.category).filter(c => c));
    const diversity = Math.min(categories.size / 5, 1); // 最多5个类别给满分
    quality += diversity * 0.2;

    return Math.min(quality, 1);
  }

  /**
   * 评估问题复杂度
   */
  assessQuestionComplexity(question) {
    if (!question) return 0.5;

    let complexity = 0;

    // 关键词复杂度评估
    const complexKeywords = [
      '为什么', '怎么', '如何', '原因', '趋势', '变化', '分析',
      '比较', '差异', '影响', '预测', '建议', '优化'
    ];

    const simpleKeywords = [
      '多少', '几个', '有没有', '是多少', '总共', '平均'
    ];

    const complexCount = complexKeywords.filter(kw =>
      question.includes(kw)
    ).length;

    const simpleCount = simpleKeywords.filter(kw =>
      question.includes(kw)
    ).length;

    if (complexCount > 0) complexity += 0.6;  // 包含复杂关键词
    if (simpleCount > 0) complexity -= 0.2;  // 包含简单关键词

    // 问题长度复杂度
    const length = question.length;
    if (length > 50) complexity += 0.2;     // 长问题
    else if (length < 10) complexity -= 0.1; // 短问题

    // 时间范围复杂度
    if (question.match(/\d{4}年/)) complexity += 0.2; // 包含年份

    // 多重条件复杂度
    const conditionWords = ['和', '与', '以及', '同时', '但是', '不过'];
    const conditionCount = conditionWords.filter(word =>
      question.includes(word)
    ).length;
    complexity += Math.min(conditionCount * 0.1, 0.2);

    return Math.min(Math.max(complexity, 0), 1);
  }

  /**
   * 评估分析深度
   */
  assessAnalysisDepth(analysis) {
    if (!analysis) return 0;

    let depth = 0;

    // 洞察数量和质量
    if (analysis.insights && analysis.insights.length > 0) {
      const insightCount = analysis.insights.length;
      const avgLength = analysis.insights.reduce((sum, insight) =>
        sum + insight.length, 0) / insightCount;

      if (insightCount >= 5) depth += 0.3;     // 丰富洞察
      else if (insightCount >= 3) depth += 0.2; // 适中洞察
      else if (insightCount >= 1) depth += 0.1; // 基础洞察

      if (avgLength > 100) depth += 0.2;      // 详细洞察
      else if (avgLength > 50) depth += 0.1;   // 一般洞察
    }

    // 建议质量
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      const recCount = analysis.recommendations.length;
      const hasSpecificAdvice = analysis.recommendations.some(rec =>
        rec.includes('¥') || rec.includes('%') || /\d+/.test(rec)
      );

      if (recCount >= 3) depth += 0.2;         // 多条建议
      else if (recCount >= 1) depth += 0.1;     // 基础建议

      if (hasSpecificAdvice) depth += 0.2;     // 具体量化建议
    }

    // 数据统计深度
    if (analysis.summary) {
      const statCount = Object.keys(analysis.summary).length;
      if (statCount >= 8) depth += 0.2;        // 全面统计
      else if (statCount >= 5) depth += 0.15;   // 较全统计
      else if (statCount >= 3) depth += 0.1;    // 基础统计
    }

    return Math.min(depth, 1);
  }

  /**
   * 评估结果一致性
   */
  assessResultConsistency(analysis) {
    if (!analysis) return 0;

    let consistency = 0.5; // 基础一致性假设

    // 检查数值一致性
    if (analysis.summary) {
      const { totalIncome, totalExpense, balance } = analysis.summary;

      // 检查平衡计算一致性
      if (totalIncome && totalExpense) {
        const calculatedBalance = totalIncome - totalExpense;
        const actualBalance = balance || 0;
        const diff = Math.abs(calculatedBalance - actualBalance);

        if (diff < 0.01) consistency += 0.2;     // 完全一致
        else if (diff < 1) consistency += 0.1;    // 基本一致
        else consistency -= 0.2;                  // 不一致
      }

      // 检查比例合理性
      if (totalIncome && totalIncome > 0) {
        const expenseRatio = totalExpense / totalIncome;
        if (expenseRatio >= 0 && expenseRatio <= 2) { // 合理范围
          consistency += 0.1;
        } else {
          consistency -= 0.1; // 不合理比例
        }
      }
    }

    // 检查逻辑一致性
    if (analysis.insights && analysis.recommendations) {
      const hasContradiction = this.checkLogicalConsistency(
        analysis.insights,
        analysis.recommendations
      );

      if (!hasContradiction) consistency += 0.2;  // 逻辑一致
      else consistency -= 0.2;                    // 存在矛盾
    }

    return Math.min(Math.max(consistency, 0), 1);
  }

  /**
   * 检查逻辑一致性
   */
  checkLogicalConsistency(insights, recommendations) {
    // 检查是否存在逻辑矛盾
    const insightText = insights.join(' ').toLowerCase();
    const recText = recommendations.join(' ').toLowerCase();

    // 矛盾模式检测
    const contradictions = [
      // 收入为正但建议减少收入
      [() => insightText.includes('收入') && recText.includes('减少收入')],

      // 支出为负但建议增加支出
      [() => insightText.includes('支出超') && recText.includes('增加支出')],

      // 储蓄率高但建议节约
      [() => insightText.includes('储蓄率') && insightText.includes('高') &&
             recText.includes('节约') && recText.includes('减少支出')]
    ];

    return contradictions.some(check => check());
  }

  /**
   * 评估内容质量
   */
  assessContentQuality(analysis) {
    if (!analysis) return 0;

    let quality = 0;

    // 量化信息评估
    const allText = [
      ...(analysis.insights || []),
      ...(analysis.recommendations || [])
    ].join(' ');

    // 检查是否包含具体数值
    const numberCount = (allText.match(/\d+(\.\d+)?/g) || []).length;
    if (numberCount >= 5) quality += 0.3;     // 丰富数值
    else if (numberCount >= 3) quality += 0.2; // 适中数值
    else if (numberCount >= 1) quality += 0.1; // 基础数值

    // 检查是否包含百分比
    const percentCount = (allText.match(/\d+(\.\d+)?%/g) || []).length;
    if (percentCount >= 2) quality += 0.2;    // 多个百分比
    else if (percentCount >= 1) quality += 0.1; // 有百分比

    // 检查个性化程度
    const personalWords = ['您', '你的', '您可以', '建议您'];
    const personalCount = personalWords.filter(word =>
      allText.includes(word)
    ).length;
    if (personalCount >= 3) quality += 0.2;    // 高度个性化
    else if (personalCount >= 1) quality += 0.1; // 基本个性化

    // 检查专业程度
    const financeTerms = ['预算', '储蓄', '投资', '理财', '收支', '结余', '比例'];
    const termCount = financeTerms.filter(term =>
      allText.includes(term)
    ).length;
    if (termCount >= 4) quality += 0.2;       // 专业术语丰富
    else if (termCount >= 2) quality += 0.1;   // 基本专业

    // 检查可操作性
    const actionWords = ['可以', '建议', '应该', '考虑', '尝试'];
    const actionCount = actionWords.filter(word =>
      allText.includes(word)
    ).length;
    if (actionCount >= 3) quality += 0.1;     // 强可操作性

    return Math.min(quality, 1);
  }

  /**
   * 生成回答
   */
  async generateResponse(prompt, context = {}) {
    if (!this.isInitialized) {
      throw new Error('TensorFlow.js AI模型未初始化');
    }

    try {
      const { searchResults, query, knowledgeBase } = context;

      // 提取账单数据
      let billList = searchResults && searchResults.length > 0
        ? searchResults.map(item => item.bill)
        : (knowledgeBase ? knowledgeBase.metadata?.map(item => item.bill) : []);

      if (!billList || billList.length === 0) {
        return {
          response: '没有找到相关的账单数据，请提供更多信息或检查数据是否正确加载。',
          confidence: 0.3,
          reasoning: '缺少账单数据'
        };
      }

      // 对年份查询进行预过滤
      billList = this.preFilterByYear(billList, query || prompt);

      // 进行智能分析
      const analysisResult = await this.analyzeBills(query || prompt, billList);

      // 构建回答 - 传入嵌套的analysis对象
      const response = this.buildResponse(analysisResult.analysis, query || prompt);

      return {
        response,
        confidence: analysisResult.confidence,
        reasoning: `基于TensorFlow.js的智能分析，问题类型：${analysisResult.type}`,
        analysis: analysisResult
      };

    } catch (error) {
      console.error('生成AI响应失败:', error);
      return {
        response: '分析过程中出现错误，请稍后重试。如果问题持续存在，请检查账单数据是否正确加载。',
        confidence: 0,
        reasoning: '处理过程中发生错误'
      };
    }
  }

  /**
   * 根据问题中的年份预过滤账单数据
   */
  preFilterByYear(billList, query) {
    if (!query || !billList || billList.length === 0) {
      return billList;
    }

    const queryLower = query.toLowerCase();

    // 提取年份（支持多种格式：2026年、2026、今年、去年等）
    let targetYear = null;

    // 直接年份匹配
    const yearMatch = queryLower.match(/(\d{4})年/);
    if (yearMatch) {
      targetYear = parseInt(yearMatch[1]);
    } else {
      // 处理相对年份
      const currentYear = new Date().getFullYear();
      if (queryLower.includes('今年')) {
        targetYear = currentYear;
      } else if (queryLower.includes('去年')) {
        targetYear = currentYear - 1;
      } else if (queryLower.includes('前年')) {
        targetYear = currentYear - 2;
      }
    }

    // 如果找到了目标年份，进行过滤
    if (targetYear !== null) {
      console.log(`🔍 根据问题"${query}"过滤${targetYear}年数据`);

      const filteredBills = billList.filter(bill => {
        try {
          const billDate = new Date(bill.date);
          const billYear = billDate.getFullYear();
          return billYear === targetYear;
        } catch (error) {
          console.warn('日期解析失败:', bill.date, error);
          return false;
        }
      });

      console.log(`📊 过滤结果: ${filteredBills.length}/${billList.length}条${targetYear}年数据`);

      // 如果过滤后没有数据，返回空数组（让AI给出适当的响应）
      return filteredBills;
    }

    // 没有年份信息，返回原始数据
    return billList;
  }

  /**
   * 构建最终回答
   */
  buildResponse(analysis, query) {
    const parts = [];

    // 添加问题确认
    if (query) {
      parts.push(`关于"${query}"的问题，我的分析结果如下：\n`);
    }

    // 添加洞察
    if (analysis.insights && analysis.insights.length > 0) {
      parts.push(...analysis.insights);
      parts.push(''); // 空行
    }

    // 添加建议
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      parts.push('💡 建议：');
      parts.push(...analysis.recommendations);
    }

    return parts.join('\n');
  }
}

// 单例实例
const tensorflowAIModel = new TensorFlowAIModel();

export default tensorflowAIModel;

// 便捷方法
export const initializeTensorFlowAI = () => tensorflowAIModel.initialize();
export const generateTensorFlowResponse = (prompt, context) => tensorflowAIModel.generateResponse(prompt, context);
export const analyzeBillsWithTensorFlow = (question, billList) => tensorflowAIModel.analyzeBills(question, billList);
