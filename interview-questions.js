/**
 * 前端面试题实现
 * 包含：并发控制Promise、URL参数解析、对象合并、数组转树、树转数组
 */

/**
 * 1. 控制并发数量的Promise
 * @param {Array<Function>} tasks - 返回Promise的任务函数数组
 * @param {number} limit - 最大并发数量
 * @returns {Promise<Array>} - 所有任务结果的Promise
 */
async function concurrentLimit(tasks, limit) {
  const results = [];
  const executing = [];

  // 任务执行器
  const executeTask = async (task, index) => {
    try {
      const result = await task();
      results[index] = result;
    } catch (error) {
      results[index] = error;
    }
  };

  // 任务调度器
  const scheduler = async () => {
    for (let i = 0; i < tasks.length; i++) {
      // 如果当前执行的任务数量达到上限，等待其中一个完成
      if (executing.length >= limit) {
        await Promise.race(executing);
      }

      const task = tasks[i];
      const taskPromise = executeTask(task, i);
      executing.push(taskPromise);

      // 当任务完成后，从执行队列中移除
      taskPromise.finally(() => {
        const index = executing.indexOf(taskPromise);
        if (index > -1) {
          executing.splice(index, 1);
        }
      });
    }

    // 等待所有任务完成
    await Promise.all(executing);
  };

  await scheduler();
  return results;
}

// 使用示例
function createTask(id, delay) {
  return () => new Promise(resolve =>
    setTimeout(() => {
      console.log(`Task ${id} completed`);
      resolve(`Result ${id}`);
    }, delay)
  );
}

// const tasks = [createTask(1, 1000), createTask(2, 500), createTask(3, 800), createTask(4, 300)];
// concurrentLimit(tasks, 2).then(results => console.log(results));


/**
 * 2. 解析URL参数
 * @param {string} url - URL字符串
 * @returns {Object} - 解析后的参数对象
 */
function parseUrlParams(url) {
  const params = {};

  try {
    // 处理URL中的查询字符串部分
    const queryString = url.split('?')[1];
    if (!queryString) return params;

    // 分割参数对
    const paramPairs = queryString.split('&');

    for (const pair of paramPairs) {
      const [key, value] = pair.split('=');

      if (key) {
        // URL解码
        const decodedKey = decodeURIComponent(key);
        const decodedValue = value ? decodeURIComponent(value) : '';

        // 处理数组参数 (key[]=value1&key[]=value2)
        if (decodedKey.endsWith('[]')) {
          const arrayKey = decodedKey.slice(0, -2);
          if (!params[arrayKey]) params[arrayKey] = [];
          params[arrayKey].push(decodedValue);
        } else {
          params[decodedKey] = decodedValue;
        }
      }
    }
  } catch (error) {
    console.error('URL参数解析失败:', error);
  }

  return params;
}

// 使用示例
// const url = 'https://example.com?name=John&age=30&hobbies[]=reading&hobbies[]=coding';
// console.log(parseUrlParams(url));
// 输出: { name: 'John', age: '30', hobbies: ['reading', 'coding'] }


/**
 * 3. 对象合并 (深拷贝合并)
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} - 合并后的新对象
 */
function deepMerge(target, source) {
  // 如果源对象不是对象或为null，直接返回目标对象
  if (source === null || typeof source !== 'object') {
    return target;
  }

  // 如果目标对象不是对象，创建新对象
  if (target === null || typeof target !== 'object') {
    return Array.isArray(source) ? [...source] : { ...source };
  }

  const result = Array.isArray(target) ? [...target] : { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        // 递归合并对象
        result[key] = deepMerge(result[key], source[key]);
      } else {
        // 直接赋值基本类型
        result[key] = source[key];
      }
    }
  }

  return result;
}

// 使用示例
// const obj1 = { a: 1, b: { c: 2 } };
// const obj2 = { b: { d: 3 }, e: 4 };
// console.log(deepMerge(obj1, obj2));
// 输出: { a: 1, b: { c: 2, d: 3 }, e: 4 }


/**
 * 4. 数组转化为树形结构
 * @param {Array} arr - 平铺的数组
 * @param {Object} options - 配置选项
 * @param {string} options.id - ID字段名
 * @param {string} options.parentId - 父ID字段名
 * @param {string} options.children - 子节点字段名
 * @returns {Array} - 树形结构的数组
 */
function arrayToTree(arr, options = {}) {
  const {
    id = 'id',
    parentId = 'parentId',
    children = 'children'
  } = options;

  const map = {};
  const roots = [];

  // 建立ID到节点的映射
  arr.forEach(item => {
    const itemId = item[id];
    map[itemId] = { ...item, [children]: [] };
  });

  // 构建树结构
  arr.forEach(item => {
    const itemId = item[id];
    const parentIdValue = item[parentId];

    const node = map[itemId];

    if (parentIdValue && map[parentIdValue]) {
      // 有父节点，添加到父节点的children中
      map[parentIdValue][children].push(node);
    } else {
      // 无父节点或父节点不存在，作为根节点
      roots.push(node);
    }
  });

  return roots;
}

// 使用示例
// const arr = [
//   { id: 1, name: '根节点1', parentId: null },
//   { id: 2, name: '根节点2', parentId: null },
//   { id: 3, name: '子节点1', parentId: 1 },
//   { id: 4, name: '子节点2', parentId: 1 },
//   { id: 5, name: '孙节点1', parentId: 3 }
// ];
// console.log(arrayToTree(arr));


/**
 * 5. 树形结构转化为数组
 * @param {Array} tree - 树形结构的数组
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名
 * @param {boolean} options.includeParent - 是否包含父节点信息
 * @returns {Array} - 平铺的数组
 */
function treeToArray(tree, options = {}) {
  const {
    children = 'children',
    includeParent = false
  } = options;

  const result = [];

  function traverse(nodes, parent = null) {
    nodes.forEach(node => {
      const item = { ...node };

      // 删除children字段，避免在结果中出现
      delete item[children];

      // 如果需要包含父节点信息
      if (includeParent && parent) {
        item.parent = parent;
      }

      result.push(item);

      // 递归处理子节点
      if (node[children] && node[children].length > 0) {
        traverse(node[children], includeParent ? item : null);
      }
    });
  }

  traverse(tree);
  return result;
}

// 使用示例
// const tree = [
//   {
//     id: 1,
//     name: '根节点1',
//     children: [
//       {
//         id: 3,
//         name: '子节点1',
//         children: [{ id: 5, name: '孙节点1' }]
//       },
//       { id: 4, name: '子节点2' }
//     ]
//   },
//   { id: 2, name: '根节点2' }
// ];
// console.log(treeToArray(tree));
// console.log(treeToArray(tree, { includeParent: true }));


/**
 * 附加：Promise.all的并发控制版本 (更简洁的实现)
 */
function concurrentLimitSimple(tasks, limit) {
  return new Promise((resolve, reject) => {
    const results = [];
    let index = 0;
    let running = 0;
    let completed = 0;

    function next() {
      // 如果所有任务都已完成
      if (completed === tasks.length) {
        resolve(results);
        return;
      }

      // 如果还有任务且未达到并发限制
      while (running < limit && index < tasks.length) {
        const currentIndex = index++;
        const task = tasks[currentIndex];

        running++;
        task()
          .then(result => {
            results[currentIndex] = result;
          })
          .catch(error => {
            results[currentIndex] = error;
          })
          .finally(() => {
            running--;
            completed++;
            next(); // 递归调用，启动下一个任务
          });
      }
    }

    next();
  });
}

module.exports = {
  concurrentLimit,
  parseUrlParams,
  deepMerge,
  arrayToTree,
  treeToArray,
  concurrentLimitSimple
};










