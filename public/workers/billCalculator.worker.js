// Web Worker 文件：用于后台计算账单数据
// 注意：Worker 中不能使用 import，需要使用 importScripts 或直接写代码

// 优化的 Lodash 替代函数集合
const _ = {
  // 核心工具函数
  isFunction: (value) => typeof value === 'function',
  isString: (value) => typeof value === 'string',
  isNumber: (value) => typeof value === 'number' && !isNaN(value),
  isArray: (value) => Array.isArray(value),
  isObject: (value) => value !== null && typeof value === 'object',

  // 获取值函数
  get: (obj, path, defaultValue) => {
    const keys = _.isString(path) ? path.split('.') : path;
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) return defaultValue;
    }
    return result;
  },

  // 分组函数
  groupBy: (array, key) => {
    if (!_.isArray(array)) return {};
    return array.reduce((result, item) => {
      const group = _.isFunction(key) ? key(item) : _.get(item, key);
      const groupKey = String(group);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    }, {});
  },

  // 排序函数
  orderBy: (array, iteratees, orders) => {
    if (!_.isArray(array)) return [];
    const sorted = [...array];

    sorted.sort((a, b) => {
      const iterateesArray = _.isArray(iteratees) ? iteratees : [iteratees];
      const ordersArray = _.isArray(orders) ? orders : [];

      for (let i = 0; i < iterateesArray.length; i++) {
        const iteratee = iterateesArray[i];
        const order = ordersArray[i] === 'desc' ? -1 : 1;

        const aVal = _.isFunction(iteratee) ? iteratee(a) : _.get(a, iteratee);
        const bVal = _.isFunction(iteratee) ? iteratee(b) : _.get(b, iteratee);

        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
      }
      return 0;
    });
    return sorted;
  },

  // 过滤函数
  filter: (array, predicate) => {
    if (!_.isArray(array)) return [];
    if (_.isFunction(predicate)) return array.filter(predicate);
    if (_.isString(predicate)) return array.filter(item => _.get(item, predicate));
    if (_.isObject(predicate)) {
      return array.filter(item =>
        Object.entries(predicate).every(([key, value]) => _.get(item, key) === value)
      );
    }
    return array;
  },

  // 映射函数
  map: (array, iteratee) => {
    if (!_.isArray(array)) return [];
    return array.map((item, index) => {
      if (_.isFunction(iteratee)) return iteratee(item, index);
      if (_.isString(iteratee)) return _.get(item, iteratee);
      return item;
    });
  },

  // 去重函数
  uniq: (array) => {
    if (!_.isArray(array)) return [];
    return [...new Set(array)];
  },

  // 去重（按key）
  uniqBy: (array, key) => {
    if (!_.isArray(array)) return [];
    const seen = new Set();
    return array.filter(item => {
      const value = _.isFunction(key) ? key(item) : _.get(item, key);
      const valueKey = JSON.stringify(value);
      if (seen.has(valueKey)) return false;
      seen.add(valueKey);
      return true;
    });
  },

  // 求和函数
  sum: (array) => {
    if (!_.isArray(array)) return 0;
    return array.reduce((sum, item) => sum + (_.isNumber(item) ? item : 0), 0);
  },

  // 求和（按key）
  sumBy: (array, key) => {
    if (!_.isArray(array)) return 0;
    return array.reduce((sum, item) => {
      const value = _.isFunction(key) ? key(item) : _.get(item, key);
      return sum + (_.isNumber(value) ? value : 0);
    }, 0);
  },

  // 平均值
  mean: (array) => {
    if (!_.isArray(array) || !array.length) return 0;
    const sum = _.sum(array);
    return sum / array.length;
  },

  // 平均值（按key）
  meanBy: (array, key) => {
    if (!_.isArray(array) || !array.length) return 0;
    const sum = _.sumBy(array, key);
    return sum / array.length;
  },

  // 最大值
  max: (array) => {
    if (!_.isArray(array) || !array.length) return undefined;
    return Math.max(...array.filter(_.isNumber));
  },

  // 最大值（按key）
  maxBy: (array, key) => {
    if (!_.isArray(array) || !array.length) return undefined;
    let maxItem = array[0];
    let maxValue = _.isFunction(key) ? key(maxItem) : _.get(maxItem, key);

    for (let i = 1; i < array.length; i++) {
      const value = _.isFunction(key) ? key(array[i]) : _.get(array[i], key);
      if (_.isNumber(value) && (_.isNumber(maxValue) ? value > maxValue : true)) {
        maxValue = value;
        maxItem = array[i];
      }
    }
    return maxItem;
  },

  // 最小值
  min: (array) => {
    if (!_.isArray(array) || !array.length) return undefined;
    return Math.min(...array.filter(_.isNumber));
  },

  // 最小值（按key）
  minBy: (array, key) => {
    if (!_.isArray(array) || !array.length) return undefined;
    let minItem = array[0];
    let minValue = _.isFunction(key) ? key(minItem) : _.get(minItem, key);

    for (let i = 1; i < array.length; i++) {
      const value = _.isFunction(key) ? key(array[i]) : _.get(array[i], key);
      if (_.isNumber(value) && (_.isNumber(minValue) ? value < minValue : true)) {
        minValue = value;
        minItem = array[i];
      }
    }
    return minItem;
  },

  // 计数函数
  countBy: (array, key) => {
    if (!_.isArray(array)) return {};
    return array.reduce((result, item) => {
      const group = _.isFunction(key) ? key(item) : _.get(item, key);
      const groupKey = String(group);
      result[groupKey] = (result[groupKey] || 0) + 1;
      return result;
    }, {});
  },

  // 采样函数（随机取样）
  sample: (array) => {
    if (!_.isArray(array) || !array.length) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  },

  // 采样多个
  sampleSize: (array, n = 1) => {
    if (!_.isArray(array)) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(n, array.length));
  },

  // 链式调用支持
  chain: (array) => {
    let result = _.isArray(array) ? [...array] : [];

    const wrapper = {
      filter: (predicate) => { result = _.filter(result, predicate); return wrapper; },
      map: (iteratee) => { result = _.map(result, iteratee); return wrapper; },
      orderBy: (iteratees, orders) => { result = _.orderBy(result, iteratees, orders); return wrapper; },
      groupBy: (key) => { result = _.groupBy(result, key); return wrapper; },
      uniq: () => { result = _.uniq(result); return wrapper; },
      uniqBy: (key) => { result = _.uniqBy(result, key); return wrapper; },
      countBy: (key) => { result = _.countBy(result, key); return wrapper; },
      sumBy: (key) => { result = _.sumBy(result, key); return wrapper; },
      meanBy: (key) => { result = _.meanBy(result, key); return wrapper; },
      maxBy: (key) => { result = _.maxBy(result, key); return wrapper; },
      minBy: (key) => { result = _.minBy(result, key); return wrapper; },
      slice: (start, end) => { result = result.slice(start, end); return wrapper; },
      take: (n) => { result = result.slice(0, n); return wrapper; },
      value: () => result,
      toArray: () => result
    };
    return wrapper;
  },

  // 深度克隆（
  cloneDeep: (obj) => JSON.parse(JSON.stringify(obj)),

  // 合并对象
  merge: (target, ...sources) => {
    const result = _.cloneDeep(target);
    sources.forEach(source => {
      if (_.isObject(source)) {
        Object.keys(source).forEach(key => {
          if (_.isObject(source[key]) && _.isObject(result[key])) {
            result[key] = _.merge(result[key], source[key]);
          } else {
            result[key] = _.cloneDeep(source[key]);
          }
        });
      }
    });
    return result;
  }
};

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 向量知识库相关功能
const VectorKnowledgeBase = {
  // 简单的文本向量化（特征提取）
  textToVector: (text, dimensions = 57) => {
    if (!text || typeof text !== 'string') return new Array(dimensions).fill(0);

    const features = [];
    const lowerText = text.toLowerCase();

    // 1. 年份特征、重要时间特征
    const yearPatterns = ['2026', '2025', '2024', '2023', '今年', '去年', '前年'];
    yearPatterns.forEach(year => {
      features.push(lowerText.includes(year.toLowerCase()) ? 1 : 0);
    });

    // 2. 月份特征
    for (let month = 1; month <= 12; month++) {
      features.push(lowerText.includes(`${month}月`) || lowerText.includes(`-${month.toString().padStart(2, '0')}`) ? 1 : 0);
    }

    // 3. 账单类型特征（收入/支出）- 高权重
    const incomePatterns = ['收入', '工资', '奖金', '兼职', '补贴', '退款', '投资', '利息', '分红', '稿费', '其他收入'];
    const expensePatterns = ['支出', '消费', '购买', '缴费', '花费', '开销', '支付', '罚款'];

    features.push(incomePatterns.some(word => lowerText.includes(word)) ? 1 : 0); // 收入标记
    features.push(expensePatterns.some(word => lowerText.includes(word)) ? 1 : 0); // 支出标记

    // 4. 消费类别特征 - 详细分类
    const categoryPatterns = {
      '餐饮': ['餐饮', '吃饭', '早餐', '午餐', '晚餐', '餐厅', '食堂', '外卖', '火锅', '烧烤'],
      '交通': ['交通', '打车', '地铁', '公交', '火车', '飞机', '加油', '停车', '高铁', '轮船'],
      '购物': ['购物', '购买', '商场', '超市', '淘宝', '京东', '衣服', '鞋子', '化妆品', '电器'],
      '娱乐': ['娱乐', '电影', '游戏', 'KTV', '酒吧', '旅游', '健身', '体育', '演唱会', '展览'],
      '医疗': ['医疗', '医院', '药店', '体检', '医生', '治疗', '医药费', '挂号', '手术'],
      '教育': ['教育', '书籍', '培训', '课程', '学费', '教材', '学校', '补习', '考试'],
      '住房': ['住房', '房租', '物业', '水电', '煤气', '房贷', '装修', '家电', '房租费'],
      '通讯': ['通讯', '电话', '上网', '流量', '手机费', '宽带', '移动', '联通', '电信'],
      '兼职': ['兼职', '兼职收入', '兼职费', '周末兼职', '节日加班费', '加班费'],
      '奖金': ['奖金', '绩效奖金', '年终奖', '奖金收入', '激励奖金'],
      '投资': ['投资', '基金', '股票', '理财', '基金收益', '利息收入']
    };

    Object.keys(categoryPatterns).forEach(category => {
      const patterns = categoryPatterns[category];
      features.push(patterns.some(pattern => lowerText.includes(pattern)) ? 1 : 0);
    });

    // 5. 金额特征 - 标准化处理
    const amountMatch = text.match(/[\d,]+\.?\d*/g);
    if (amountMatch) {
      const amounts = amountMatch.map(a => parseFloat(a.replace(/,/g, ''))).filter(a => !isNaN(a) && a > 0);
      if (amounts.length > 0) {
        const maxAmount = Math.max(...amounts);
        const avgAmount = _.mean(amounts);
        const totalAmount = _.sum(amounts);

        // 金额等级特征（便于相似度计算）
        features.push(maxAmount < 100 ? 1 : 0); // 小金额(<100)
        features.push(maxAmount >= 100 && maxAmount < 500 ? 1 : 0); // 中小金额(100-500)
        features.push(maxAmount >= 500 && maxAmount < 1000 ? 1 : 0); // 中等金额(500-1000)
        features.push(maxAmount >= 1000 && maxAmount < 5000 ? 1 : 0); // 大金额(1000-5000)
        features.push(maxAmount >= 5000 ? 1 : 0); // 超大金额(>=5000)

        features.push(avgAmount / 1000); // 平均金额标准化
        features.push(totalAmount / 10000); // 总金额标准化
      } else {
        features.push(0, 0, 0, 0, 0, 0, 0); // 7个金额相关特征
      }
    } else {
      features.push(0, 0, 0, 0, 0, 0, 0); // 没有金额信息
    }

    // 6. 时间相关特征
    const timePatterns = ['今天', '昨天', '本月', '上月', '本周', '上周', '今年', '去年', '周末', '工作日', '节假日'];
    timePatterns.forEach(pattern => {
      features.push(lowerText.includes(pattern) ? 1 : 0);
    });

    // 7. 文本结构特征
    features.push(text.includes('金额:') ? 1 : 0); // 结构化金额标记
    features.push(text.includes('类型:') ? 1 : 0); // 结构化类型标记
    features.push(text.includes('日期:') ? 1 : 0); // 结构化日期标记

    // 8. 描述丰富度特征
    const wordCount = text.split(/\s+/).length;
    features.push(wordCount / 20); // 词数标准化
    features.push(text.length > 50 ? 1 : 0); // 长描述标记

    // 9. 特殊消费模式特征
    features.push(lowerText.includes('定期') || lowerText.includes('每月') ? 1 : 0); // 定期消费
    features.push(lowerText.includes('一次性') || lowerText.includes(' impulse') ? 1 : 0); // 冲动消费

    // 填充到指定维度（使用0而不是随机数，以保证一致性）
    while (features.length < dimensions) {
      features.push(0);
    }

    return features.slice(0, dimensions);
  },

  // 余弦相似度计算
  cosineSimilarity: (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  },

  // 账单数据转换为向量知识库
  buildKnowledgeBase: (billList) => {
    const knowledgeBase = {
      vectors: [],
      metadata: [],
      dimensions: 57 // 更新维度以匹配新的特征数量
    };

    billList.forEach((bill, index) => {
      // 构建账单的文本表示
      const billText = [
        bill.category || bill.useFor || '其他',
        bill.description || '',
        `金额: ${Math.abs(bill.money || 0)}`,
        `类型: ${(bill.money || 0) > 0 ? '收入' : '支出'}`,
        `日期: ${formatDate(bill.date)}`
      ].join(' ');

      // 生成向量
      const vector = VectorKnowledgeBase.textToVector(billText, knowledgeBase.dimensions);

      knowledgeBase.vectors.push(vector);
      knowledgeBase.metadata.push({
        id: bill.id,
        index,
        text: billText,
        bill: bill,
        category: bill.category || bill.useFor || '其他',
        amount: Math.abs(bill.money || 0),
        type: (bill.money || 0) > 0 ? 'income' : 'expense',
        date: formatDate(bill.date)
      });
    });

    return knowledgeBase;
  },

  // 向量搜索
  search: (knowledgeBase, query, topK = 5) => {
    console.log('VectorKnowledgeBase.search: 开始搜索');
    console.log('知识库检查:', {
      knowledgeBase: !!knowledgeBase,
      vectors: knowledgeBase?.vectors?.length || 0,
      metadata: knowledgeBase?.metadata?.length || 0,
      dimensions: knowledgeBase?.dimensions || 0
    });

    if (!knowledgeBase || !knowledgeBase.vectors.length) {
      console.log('❌ 知识库无效或为空');
      return [];
    }

    // 检查是否包含年份查询
    const yearMatches = query.match(/(\d{4})年/);
    let yearFilteredResults = null;

    if (yearMatches) {
      const targetYear = yearMatches[1];
      console.log(`检测到年份查询: ${targetYear}年`);

      // 过滤指定年份的数据
      yearFilteredResults = knowledgeBase.metadata.filter(item => {
        try {
          const billDate = new Date(item.date);
          return billDate.getFullYear().toString() === targetYear;
        } catch (error) {
          console.warn('日期解析失败:', item.date, error);
          return false;
        }
      });

      console.log(`找到 ${yearFilteredResults.length} 条 ${targetYear} 年数据`);

      // 如果指定年份有数据，直接返回所有年份数据（不受topK限制）
      if (yearFilteredResults.length > 0) {
        console.log(`找到 ${yearFilteredResults.length} 条年份数据，直接返回所有年份数据`);
        const allYearResults = yearFilteredResults.map(item => ({
          ...item,
          similarity: 1.0 // 年份匹配给满分相似度
        }));

        // 如果年份数据量超过topK，返回所有年份数据
        // 否则返回年份数据并补充其他相关数据
        if (yearFilteredResults.length >= Math.min(topK, 20)) { // 如果年份数据足够多
          console.log(`年份数据充足 (${yearFilteredResults.length}条)，返回所有年份数据`);
          return allYearResults;
        } else {
          console.log(` 年份数据较少 (${yearFilteredResults.length}条)，补充其他相关数据`);
          // 年份数据不够，保留这些数据，然后补充语义搜索的结果
          const remainingSlots = topK - yearFilteredResults.length;
          yearFilteredResults = yearFilteredResults.map(item => ({
            ...item,
            similarity: 1.0
          }));

          // 继续进行语义搜索，排除已选择的年份数据
          const yearFilteredIds = new Set(yearFilteredResults.map(item => item.id));
          const remainingMetadata = knowledgeBase.metadata.filter(item => !yearFilteredIds.has(item.id));

          if (remainingMetadata.length > 0) {
            console.log('补充语义搜索...');
            const queryVector = VectorKnowledgeBase.textToVector(query, knowledgeBase.dimensions);
            const similarities = remainingMetadata.map((item, index) => {
              const vectorIndex = knowledgeBase.metadata.findIndex(meta => meta.id === item.id);
              const similarity = VectorKnowledgeBase.cosineSimilarity(queryVector, knowledgeBase.vectors[vectorIndex]);
              return {
                ...item,
                similarity
              };
            });

            const sortedRemaining = _.orderBy(similarities, ['similarity'], ['desc']);
            const additionalResults = sortedRemaining.slice(0, remainingSlots);

            console.log(`年份数据: ${yearFilteredResults.length}, 补充数据: ${additionalResults.length}`);

            return [...yearFilteredResults, ...additionalResults];
          } else {
            console.log(' 没有更多数据补充，返回年份数据');
            return yearFilteredResults;
          }
        }
      }
    }

    console.log('执行标准语义搜索...');
    const queryVector = VectorKnowledgeBase.textToVector(query, knowledgeBase.dimensions);
    console.log('查询向量生成完成，维度:', queryVector.length);

    console.log('🔢 计算相似度...');
    const similarities = knowledgeBase.metadata.map((item, index) => {
      const similarity = VectorKnowledgeBase.cosineSimilarity(queryVector, knowledgeBase.vectors[index]);
      return {
        ...item,
        similarity
      };
    });

    console.log('相似度计算完成，样本值:');
    similarities.slice(0, 3).forEach((item, index) => {
      console.log(`  [${index}] ${item.category}: ${item.similarity.toFixed(4)}`);
    });

    console.log(' 排序结果...');
    const sortedResults = _.orderBy(similarities, ['similarity'], ['desc']);
    const topResults = sortedResults.slice(0, topK);

    console.log('返回Top结果:');
    topResults.forEach((result, index) => {
      console.log(`  Top${index + 1}: ${result.category} (${result.similarity.toFixed(4)})`);
    });

    return topResults;
  },

};

// 账单数据计算函数（增强版，使用lodash替代函数）
const buildSummary = (billList = [], rangeLabel = '全部账单') => {
  // 数据标准化
  const normalized = billList.map(item => ({
    id: item.id,
    money: item.money || 0,
    type: item.type || 'expense',
    category: item.category || item.useFor || '其他',
    description: item.description || '',
    date: formatDate(item.date),
    // 添加更多字段用于分析
    absMoney: Math.abs(item.money || 0),
    isIncome: (item.money || 0) > 0,
    isExpense: (item.money || 0) < 0
  }));

  // 使用lodash函数计算收入和支出
  const income = _.sumBy(_.filter(normalized, 'isIncome'), 'money');
  const expense = _.sumBy(_.filter(normalized, 'isExpense'), 'absMoney');
  const balance = income - expense;

  // 分类聚合（Top5）- 使用lodash链式调用
  const categoryGroup = _.chain(normalized)
    .filter('isExpense')
    .groupBy('category')
    .map((items, key) => ({
      name: key,
      expense: _.sumBy(items, 'absMoney'),
      count: items.length,
      average: _.meanBy(items, 'absMoney')
    }))
    .orderBy(['expense'], ['desc'])
    .slice(0, 5)
    .value();

  // 时间聚合（日趋势）- 使用lodash
  const dailyTrend = _.chain(normalized)
    .groupBy('date')
    .map((items, key) => ({
      date: key,
      income: _.sumBy(_.filter(items, 'isIncome'), 'money'),
      expense: _.sumBy(_.filter(items, 'isExpense'), 'absMoney'),
      count: items.length,
      netFlow: _.sumBy(_.filter(items, 'isIncome'), 'money') - _.sumBy(_.filter(items, 'isExpense'), 'absMoney')
    }))
    .orderBy(['date'], ['asc'])
    .value();

  // 月度聚合
  const monthlyTrend = _.chain(normalized)
    .map(item => ({ ...item, month: item.date.substring(0, 7) }))
    .groupBy('month')
    .map((items, key) => ({
      month: key,
      income: _.sumBy(_.filter(items, 'isIncome'), 'money'),
      expense: _.sumBy(_.filter(items, 'isExpense'), 'absMoney'),
      balance: _.sumBy(_.filter(items, 'isIncome'), 'money') - _.sumBy(_.filter(items, 'isExpense'), 'absMoney'),
      count: items.length
    }))
    .orderBy(['month'], ['asc'])
    .value();

  // 消费习惯分析
  const expenseAnalysis = _.chain(normalized)
    .filter('isExpense')
    .groupBy('category')
    .map((items, key) => {
      const amounts = items.map(item => item.absMoney);
      return {
        category: key,
        total: _.sum(amounts),
        count: items.length,
        average: _.mean(amounts),
        max: _.max(amounts),
        min: _.min(amounts),
        percentage: 0 // 将在后面计算
      };
    })
    .value();

  // 计算百分比
  const totalExpense = _.sumBy(expenseAnalysis, 'total');
  expenseAnalysis.forEach(item => {
    item.percentage = totalExpense > 0 ? (item.total / totalExpense * 100).toFixed(2) : 0;
  });

  // 收入来源分析
  const incomeAnalysis = _.chain(normalized)
    .filter('isIncome')
    .groupBy('category')
    .map((items, key) => ({
      category: key,
      total: _.sumBy(items, 'money'),
      count: items.length,
      average: _.meanBy(items, 'money'),
      percentage: 0 // 将在后面计算
    }))
    .value();

  const totalIncome = _.sumBy(incomeAnalysis, 'total');
  incomeAnalysis.forEach(item => {
    item.percentage = totalIncome > 0 ? (item.total / totalIncome * 100).toFixed(2) : 0;
  });

  return {
    range: rangeLabel,
    summary: {
      income,
      expense,
      balance,
      totalCount: normalized.length,
      incomeCount: _.filter(normalized, 'isIncome').length,
      expenseCount: _.filter(normalized, 'isExpense').length
    },
    topCategories: categoryGroup,
    dailyTrend,
    monthlyTrend,
    expenseAnalysis,
    incomeAnalysis,
    // 统计指标
    statistics: {
      averageDailyExpense: expense / Math.max(dailyTrend.length, 1),
      averageDailyIncome: income / Math.max(dailyTrend.length, 1),
      maxSingleExpense: _.maxBy(_.filter(normalized, 'isExpense'), 'absMoney')?.absMoney || 0,
      maxSingleIncome: _.maxBy(_.filter(normalized, 'isIncome'), 'money')?.money || 0,
      mostFrequentCategory: _.maxBy(categoryGroup, 'count')?.name || '无',
      expenseToIncomeRatio: income > 0 ? (expense / income * 100).toFixed(2) : 0
    }
  };
};

// 生成适用于不同AI模型的格式化prompt
const generateAIPrompt = (billList = [], question = '', rangeLabel = '全部账单', modelType = 'general') => {
  const summary = buildSummary(billList, rangeLabel);

  // 根据模型类型生成不同的prompt格式
  const formatters = {
    // 通用的结构化文本格式
    general: () => generateGeneralPrompt(summary, question, rangeLabel),

    // JSON格式（适用于结构化AI模型）
    json: () => generateJSONPrompt(summary, question, rangeLabel),

    // Markdown格式（适用于支持markdown的模型）
    markdown: () => generateMarkdownPrompt(summary, question, rangeLabel),

    // 简洁格式（适用于token限制严格的模型）
    concise: () => generateConcisePrompt(summary, question, rangeLabel)
  };

  const formatter = formatters[modelType] || formatters.general;
  const formattedPrompt = formatter();

  return {
    prompt: formattedPrompt.prompt,
    summary,
    metadata: {
      rangeLabel,
      question: question || null,
      modelType,
      generatedAt: new Date().toISOString(),
      dataPoints: summary.summary.totalCount,
      promptLength: formattedPrompt.prompt.length
    }
  };
};

// 生成通用文本格式的prompt
const generateGeneralPrompt = (summary, question, rangeLabel) => {
  const promptParts = [
    `请作为专业的财务分析师，分析用户的${rangeLabel}账单数据。`,
    '',
    '📊 财务概况：',
    `- 总收入：¥${summary.summary.income.toFixed(2)}`,
    `- 总支出：¥${summary.summary.expense.toFixed(2)}`,
    `- 结余：¥${summary.summary.balance.toFixed(2)}`,
    `- 交易笔数：${summary.summary.totalCount}（收入：${summary.summary.incomeCount}，支出：${summary.summary.expenseCount}）`,
    ''
  ];

  if (summary.topCategories.length > 0) {
    promptParts.push('💰 支出TOP分类：');
    summary.topCategories.forEach((cat, index) => {
      promptParts.push(`${index + 1}. ${cat.name}：¥${cat.expense.toFixed(2)}（${cat.count}笔，平均¥${cat.average.toFixed(2)}）`);
    });
    promptParts.push('');
  }

  if (summary.expenseAnalysis.length > 0) {
    promptParts.push('📈 支出分析：');
    summary.expenseAnalysis.slice(0, 8).forEach(cat => {
      promptParts.push(`- ${cat.category}：¥${cat.total.toFixed(2)}（${cat.percentage}%），平均¥${cat.average.toFixed(2)}`);
    });
    promptParts.push('');
  }

  if (summary.incomeAnalysis.length > 0) {
    promptParts.push('💵 收入来源：');
    summary.incomeAnalysis.forEach(cat => {
      promptParts.push(`- ${cat.category}：¥${cat.total.toFixed(2)}（${cat.percentage}%），平均¥${cat.average.toFixed(2)}`);
    });
    promptParts.push('');
  }

  if (summary.monthlyTrend.length > 0) {
    promptParts.push('月度趋势：');
    summary.monthlyTrend.slice(-3).forEach(month => {
      promptParts.push(`- ${month.month}：收入¥${month.income.toFixed(2)}，支出¥${month.expense.toFixed(2)}，结余¥${month.balance.toFixed(2)}`);
    });
    promptParts.push('');
  }

  promptParts.push('关键指标：');
  promptParts.push(`- 日均支出：¥${summary.statistics.averageDailyExpense.toFixed(2)}`);
  promptParts.push(`- 日均收入：¥${summary.statistics.averageDailyIncome.toFixed(2)}`);
  promptParts.push(`- 单笔最大支出：¥${summary.statistics.maxSingleExpense.toFixed(2)}`);
  promptParts.push(`- 单笔最大收入：¥${summary.statistics.maxSingleIncome.toFixed(2)}`);
  promptParts.push(`- 最常消费类别：${summary.statistics.mostFrequentCategory}`);
  promptParts.push(`- 支出收入比：${summary.statistics.expenseToIncomeRatio}%`);
  promptParts.push('');

  if (question && question.trim()) {
    promptParts.push(`用户问题：${question.trim()}`);
    promptParts.push('');
    promptParts.push('请基于以上数据，给出针对性的财务建议和分析。');
  } else {
    promptParts.push('请提供以下分析：');
    promptParts.push('1. 整体财务状况评估');
    promptParts.push('2. 支出结构分析和优化建议');
    promptParts.push('3. 收入稳定性分析');
    promptParts.push('4. 财务规划建议');
    promptParts.push('5. 风险提醒和注意事项');
  }

  return { prompt: promptParts.join('\n') };
};

// 生成JSON格式的prompt
const generateJSONPrompt = (summary, question, rangeLabel) => {
  const promptData = {
    instruction: '作为专业的财务分析师，请分析用户的账单数据并提供建议。',
    context: {
      range: rangeLabel,
      question: question || null,
      summary: {
        income: summary.summary.income,
        expense: summary.summary.expense,
        balance: summary.summary.balance,
        totalCount: summary.summary.totalCount
      },
      topCategories: summary.topCategories,
      statistics: summary.statistics,
      trends: {
        daily: summary.dailyTrend.slice(-7), // 最近7天
        monthly: summary.monthlyTrend.slice(-3) // 最近3月
      }
    },
    requirements: question ? [question] : [
      '整体财务状况评估',
      '支出结构分析和优化建议',
      '收入稳定性分析',
      '财务规划建议',
      '风险提醒和注意事项'
    ]
  };

  return {
    prompt: JSON.stringify(promptData, null, 2),
    isJsonFormat: true
  };
};

// 生成Markdown格式的prompt
const generateMarkdownPrompt = (summary, question, rangeLabel) => {
  const promptParts = [
    '# 财务账单分析请求',
    '',
    `## 数据范围: ${rangeLabel}`,
    '',
    '## 财务概况',
    `| 指标 | 金额 |`,
    `|------|------|`,
    `| 总收入 | ¥${summary.summary.income.toFixed(2)} |`,
    `| 总支出 | ¥${summary.summary.expense.toFixed(2)} |`,
    `| 结余 | ¥${summary.summary.balance.toFixed(2)} |`,
    `| 交易笔数 | ${summary.summary.totalCount} |`,
    ''
  ];

  if (summary.topCategories.length > 0) {
    promptParts.push('## 支出TOP分类');
    promptParts.push('| 排名 | 分类 | 金额 | 笔数 | 平均 |');
    promptParts.push('|------|------|------|------|------|');
    summary.topCategories.forEach((cat, index) => {
      promptParts.push(`| ${index + 1} | ${cat.name} | ¥${cat.expense.toFixed(2)} | ${cat.count} | ¥${cat.average.toFixed(2)} |`);
    });
    promptParts.push('');
  }

  promptParts.push('关键指标');
  promptParts.push(`- **日均支出**: ¥${summary.statistics.averageDailyExpense.toFixed(2)}`);
  promptParts.push(`- **日均收入**: ¥${summary.statistics.averageDailyIncome.toFixed(2)}`);
  promptParts.push(`- **支出收入比**: ${summary.statistics.expenseToIncomeRatio}%`);
  promptParts.push('');

  if (question && question.trim()) {
    promptParts.push(` 用户问题`);
    promptParts.push(`> ${question.trim()}`);
    promptParts.push('');
    promptParts.push('请基于以上数据，给出针对性的财务建议和分析。');
  } else {
    promptParts.push('分析要求');
    promptParts.push('1. 整体财务状况评估');
    promptParts.push('2. 支出结构分析和优化建议');
    promptParts.push('3. 收入稳定性分析');
    promptParts.push('4. 财务规划建议');
    promptParts.push('5. 风险提醒和注意事项');
  }

  return { prompt: promptParts.join('\n') };
};

// 生成简洁格式的prompt（适用于token限制严格的模型）
const generateConcisePrompt = (summary, question, rangeLabel) => {
  const conciseData = {
    range: rangeLabel,
    income: summary.summary.income.toFixed(0),
    expense: summary.summary.expense.toFixed(0),
    balance: summary.summary.balance.toFixed(0),
    topExpense: summary.topCategories[0]?.name || '无',
    avgDailyExpense: summary.statistics.averageDailyExpense.toFixed(0),
    expenseRatio: summary.statistics.expenseToIncomeRatio
  };

  const promptParts = [
    `分析${rangeLabel}：收入¥${conciseData.income}，支出¥${conciseData.expense}，结余¥${conciseData.balance}。`,
    `主要支出：${conciseData.topExpense}，日均支出¥${conciseData.avgDailyExpense}，支出占比${conciseData.expenseRatio}%。`
  ];

  if (question) {
    promptParts.push(`问题：${question}`);
  } else {
    promptParts.push('请分析财务状况并给出建议。');
  }

  return { prompt: promptParts.join(' ') };
};

// 生成基于向量搜索的问答prompt
const generateVectorQAPrompt = (knowledgeBase, query, searchResults = [], context = {}) => {
  const promptParts = [
    '基于以下账单数据，请回答用户的问题。',
    '',
    `用户问题：${query}`,
    ''
  ];

  // 添加相关账单数据
  if (searchResults && searchResults.length > 0) {
    promptParts.push('相关账单记录：');
    searchResults.forEach((result, index) => {
      const bill = result.bill;
      promptParts.push(`${index + 1}. [${result.category}] ${result.text}`);
      promptParts.push(`   相似度: ${(result.similarity * 100).toFixed(1)}%`);
      promptParts.push(`   金额: ¥${result.amount} (${result.type === 'income' ? '收入' : '支出'})`);
      promptParts.push(`   日期: ${result.date}`);
      promptParts.push('');
    });
  } else {
    promptParts.push('未找到直接相关的账单记录。');
    promptParts.push('');
  }

  // 添加统计信息
  if (knowledgeBase && knowledgeBase.metadata) {
    const totalItems = knowledgeBase.metadata.length;
    const categories = _.countBy(knowledgeBase.metadata, 'category');
    const totalIncome = _.sumBy(knowledgeBase.metadata.filter(item => item.type === 'income'), 'amount');
    const totalExpense = _.sumBy(knowledgeBase.metadata.filter(item => item.type === 'expense'), 'amount');

    promptParts.push('账单统计信息：');
    promptParts.push(`- 总记录数: ${totalItems}`);
    promptParts.push(`- 总收入: ¥${totalIncome.toFixed(2)}`);
    promptParts.push(`- 总支出: ¥${totalExpense.toFixed(2)}`);
    promptParts.push(`- 分类数量: ${Object.keys(categories).length}`);
    promptParts.push('');

    // 添加主要分类统计
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topCategories.length > 0) {
      promptParts.push('主要消费分类：');
      topCategories.forEach(([category, count]) => {
        promptParts.push(`- ${category}: ${count}笔`);
      });
      promptParts.push('');
    }
  }

  // 添加上下文信息
  if (context && Object.keys(context).length > 0) {
    promptParts.push('额外上下文：');
    Object.entries(context).forEach(([key, value]) => {
      promptParts.push(`- ${key}: ${value}`);
    });
    promptParts.push('');
  }

  // 添加回答指导
  promptParts.push('请根据以上信息回答用户的问题。如果问题涉及具体金额或交易，请引用相关记录。如果是统计性问题，请提供准确的数据。如果是建议性问题，请基于数据给出合理的建议。');

  return {
    prompt: promptParts.join('\n'),
    metadata: {
      query,
      resultCount: searchResults?.length || 0,
      knowledgeBaseSize: knowledgeBase?.metadata?.length || 0,
      generatedAt: new Date().toISOString(),
      contextProvided: Boolean(context && Object.keys(context).length > 0)
    }
  };
};

// 监听主线程发送的消息
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'BUILD_VECTOR_KNOWLEDGE_BASE':
        // 构建向量知识库
        console.log('🔧 Web Worker: 开始构建向量知识库');
        console.log('📊 接收到的账单数据:', data.billList);
        console.log('📈 账单数量:', data.billList?.length || 0);

        if (!data.billList || data.billList.length === 0) {
          self.postMessage({
            type: 'ERROR',
            error: '没有可处理的账单数据'
          });
          break;
        }

        const knowledgeBase = VectorKnowledgeBase.buildKnowledgeBase(data.billList);
        console.log('Web Worker: 知识库构建完成');
        console.log('知识库统计:', {
          vectors: knowledgeBase.vectors.length,
          metadata: knowledgeBase.metadata.length,
          dimensions: knowledgeBase.dimensions
        });

        self.postMessage({
          type: 'BUILD_VECTOR_KNOWLEDGE_BASE_SUCCESS',
          data: {
            messageId: data.messageId,
            knowledgeBase,
            stats: {
              totalItems: knowledgeBase.metadata.length,
              dimensions: knowledgeBase.dimensions,
              categories: _.uniqBy(knowledgeBase.metadata, 'category').map(item => item.category),
              dateRange: {
                start: _.minBy(knowledgeBase.metadata, 'date')?.date,
                end: _.maxBy(knowledgeBase.metadata, 'date')?.date
              }
            }
          }
        });
        break;

      case 'VECTOR_SEARCH':
        // 向量搜索
        console.log('Web Worker: 开始向量搜索');
        console.log('知识库状态:', {
          exists: !!data.knowledgeBase,
          vectors: data.knowledgeBase?.vectors?.length || 0,
          metadata: data.knowledgeBase?.metadata?.length || 0,
          dimensions: data.knowledgeBase?.dimensions || 0
        });
        console.log(' 查询文本:', data.query);
        console.log(' TopK:', data.topK || 5);

        const searchResults = VectorKnowledgeBase.search(data.knowledgeBase, data.query, data.topK || 5);

        console.log(' Web Worker: 向量搜索完成');
        console.log(' 搜索结果数量:', searchResults?.length || 0);
        console.log(' 搜索结果详情:', searchResults);

        self.postMessage({
          type: 'VECTOR_SEARCH_SUCCESS',
          data: {
            messageId: data.messageId,
            results: searchResults,
            query: data.query,
            searchTime: Date.now()
          }
        });
        break;


      case 'GENERATE_VECTOR_QA_PROMPT':
        // 生成基于向量搜索的问答prompt
        const qaPrompt = generateVectorQAPrompt(data.knowledgeBase, data.query, data.searchResults, data.context);

        self.postMessage({
          type: 'GENERATE_VECTOR_QA_PROMPT_SUCCESS',
          data: {
            messageId: data.messageId,
            ...qaPrompt
          }
        });
        break;

      default:
        self.postMessage({
          type: 'ERROR',
          error: `未知的操作类型: ${type}`
        });
    }
  } catch (error) {
    // 发送错误信息回主线程
    self.postMessage({
      type: 'ERROR',
      error: error.message || '计算过程中发生错误'
    });
  }
});

// Worker 初始化完成
self.postMessage({ type: 'WORKER_READY' });











