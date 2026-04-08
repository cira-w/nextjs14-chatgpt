import { useState, useEffect, useRef, useCallback } from "react";

interface UseStreamingBufferOptions {
  /** 累积多少个新字符后更新显示（默认 10） */
  charThreshold?: number;
  /** 距上次更新的时间间隔（毫秒，默认 300） */
  timeThreshold?: number;
  /** 是否正在流式传输中 */
  isStreaming?: boolean;
}

interface UseStreamingBufferReturn {
  /** 实际显示的内容（经过缓冲处理） */
  displayedContent: string;
  /** 强制刷新，输出累积的全部内容 */
  flush: () => void;
  /** 是否正在等待更多内容缓冲 */
  isBuffering: boolean;
}

/**
 * 流式内容缓冲 Hook
 * 实现 token 数量 + 时间间隔双重缓冲策略，减少频繁重渲染
 *
 * @param content - 原始流式内容（来自数据库的最新完整内容）
 * @param options - 缓冲配置选项
 * @returns 缓冲后的显示内容及相关控制函数
 */
export function useStreamingContent(
  content: string,
  options: UseStreamingBufferOptions = {}
): UseStreamingBufferReturn {
  const {
    charThreshold = 10,
    timeThreshold = 300,
    isStreaming = true,
  } = options;

  const [displayedContent, setDisplayedContent] = useState(content);
  const [isBuffering, setIsBuffering] = useState(false);

  // 用于追踪上一次显示的内容，避免重复渲染
  const lastDisplayedRef = useRef(content);
  // 累积的增量内容（相对于上次显示的内容）
  const accumulatedDeltaRef = useRef("");
  // 上次更新时间戳
  const lastUpdateTimeRef = useRef(Date.now());
  // 定时器 ID
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 刷新显示：输出累积的增量内容
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setDisplayedContent(content);
    lastDisplayedRef.current = content;
    accumulatedDeltaRef.current = "";
    setIsBuffering(false);
  }, [content]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 主逻辑：监听 content 变化，触发缓冲处理
  useEffect(() => {
    // 非流式状态，直接显示
    if (!isStreaming) {
      flush();
      return;
    }

    // 计算增量内容
    const newDelta = content.slice(lastDisplayedRef.current.length);
    accumulatedDeltaRef.current += newDelta;

    // 如果增量内容达到阈值，立即更新
    if (accumulatedDeltaRef.current.length >= charThreshold) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const newDisplayed = content.slice(
        0,
        lastDisplayedRef.current.length + accumulatedDeltaRef.current.length
      );
      setDisplayedContent(newDisplayed);
      lastDisplayedRef.current = newDisplayed;
      accumulatedDeltaRef.current = "";
      lastUpdateTimeRef.current = Date.now();
      setIsBuffering(false);
      return;
    }

    // 否则，设置定时器等待
    setIsBuffering(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
    const remainingTime = Math.max(0, timeThreshold - timeSinceLastUpdate);

    timerRef.current = setTimeout(() => {
      if (accumulatedDeltaRef.current.length > 0) {
        const newDisplayed = content.slice(
          0,
          lastDisplayedRef.current.length + accumulatedDeltaRef.current.length
        );
        setDisplayedContent(newDisplayed);
        lastDisplayedRef.current = newDisplayed;
        accumulatedDeltaRef.current = "";
        lastUpdateTimeRef.current = Date.now();
      }
      setIsBuffering(false);
    }, remainingTime);
  }, [content, charThreshold, timeThreshold, isStreaming, flush]);

  return {
    displayedContent,
    flush,
    isBuffering,
  };
}
