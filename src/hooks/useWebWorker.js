import { useEffect, useRef, useState, useCallback } from 'react';

/**
  自定义 Hook：封装 Web Worker 的使用
 */
export const useWebWorker = (workerPath) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);

  // 初始化 Worker
  useEffect(() => {
    if (!workerPath) return;

    try {
      // 创建 Worker 实例
      // 在 CRA 项目中，直接使用相对路径或绝对路径
      workerRef.current = new Worker(workerPath);

      // 监听 Worker 消息
      workerRef.current.onmessage = (event) => {
        const message = event.data;
        const { type, data, error: workerError } = message;

        // Worker 准备就绪
        if (type === 'WORKER_READY') {
          console.log('Worker 已准备就绪');
          return;
        }

        // 处理错误
        if (type === 'ERROR' || workerError) {
          setError(workerError || 'Worker 执行出错');
          setLoading(false);
          return;
        }

        // 处理成功结果 - 保存完整的消息对象
        setResult(message);
        setError(null);
        setLoading(false);
      };

      // 监听 Worker 错误
      workerRef.current.onerror = (error) => {
        console.error('Worker 错误:', error);
        setError(error.message || 'Worker 执行出错');
        setLoading(false);
      };
    } catch (err) {
      console.error('创建 Worker 失败:', err);
      setError(err.message);
    }

    // 清理函数：组件卸载时终止 Worker
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [workerPath]);

  // 向 Worker 发送消息
  const postMessage = useCallback((type, data) => {
    if (!workerRef.current) {
      setError('Worker 未初始化');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    workerRef.current.postMessage({ type, data });
  }, []);

  // 终止 Worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setLoading(false);
    }
  }, []);

  return {
    result,
    error,
    loading,
    postMessage,
    terminate
  };
};


export const useBillCalculator = () => {
  // 在 CRA 中，Worker 文件放在 public 目录下，可以直接通过路径访问
  // 或者使用内联 Worker（通过 Blob URL）
  const workerPath = `${process.env.PUBLIC_URL || ''}/workers/billCalculator.worker.js`;
  
  const { result, error, loading, postMessage } = useWebWorker(workerPath);

  const calculate = useCallback((billList, rangeLabel = '全部账单') => {
    postMessage('CALCULATE_SUMMARY', { billList, rangeLabel });
  }, [postMessage]);

  return {
    summary: result,
    error,
    loading,
    calculate
  };
};

