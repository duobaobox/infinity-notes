/**
 * 输入测试工具函数
 * 用于测试和验证输入处理的正确性，特别是中文输入法相关问题
 */

/**
 * 模拟快速输入测试
 * @param inputElement 输入元素
 * @param text 要输入的文本
 * @param delay 每个字符之间的延迟（毫秒）
 */
export const simulateRapidInput = async (
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  delay: number = 50
): Promise<void> => {
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 模拟输入事件
    const inputEvent = new Event('input', { bubbles: true });
    inputElement.value = text.substring(0, i + 1);
    inputElement.dispatchEvent(inputEvent);
    
    // 等待指定延迟
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

/**
 * 模拟中文输入法合成事件
 * @param inputElement 输入元素
 * @param compositionText 合成文本
 * @param finalText 最终文本
 */
export const simulateCompositionInput = async (
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  compositionText: string,
  finalText: string
): Promise<void> => {
  // 开始合成
  const compositionStartEvent = new CompositionEvent('compositionstart', {
    bubbles: true,
    data: ''
  });
  inputElement.dispatchEvent(compositionStartEvent);
  
  // 合成过程中的更新
  const compositionUpdateEvent = new CompositionEvent('compositionupdate', {
    bubbles: true,
    data: compositionText
  });
  inputElement.dispatchEvent(compositionUpdateEvent);
  
  // 结束合成
  const compositionEndEvent = new CompositionEvent('compositionend', {
    bubbles: true,
    data: finalText
  });
  inputElement.value = finalText;
  inputElement.dispatchEvent(compositionEndEvent);
  
  // 触发input事件
  const inputEvent = new Event('input', { bubbles: true });
  inputElement.dispatchEvent(inputEvent);
};

/**
 * 测试输入防抖功能
 * @param callback 防抖回调函数
 * @param inputs 输入数组
 * @param debounceTime 防抖时间
 */
export const testDebounceInput = async (
  callback: (value: string) => void,
  inputs: string[],
  debounceTime: number
): Promise<string[]> => {
  const results: string[] = [];
  
  // 包装回调函数以收集结果
  const wrappedCallback = (value: string) => {
    results.push(value);
    callback(value);
  };
  
  // 快速连续调用
  for (const input of inputs) {
    wrappedCallback(input);
    await new Promise(resolve => setTimeout(resolve, 10)); // 很短的间隔
  }
  
  // 等待防抖时间完成
  await new Promise(resolve => setTimeout(resolve, debounceTime + 50));
  
  return results;
};

/**
 * 验证输入处理的正确性
 * @param expectedValue 期望值
 * @param actualValue 实际值
 * @param testName 测试名称
 */
export const validateInputResult = (
  expectedValue: string,
  actualValue: string,
  testName: string
): boolean => {
  const isValid = expectedValue === actualValue;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧪 输入测试 [${testName}]:`, {
      expected: expectedValue,
      actual: actualValue,
      result: isValid ? '✅ 通过' : '❌ 失败'
    });
  }
  
  return isValid;
};

/**
 * 检测输入法状态
 * @param element 输入元素
 */
export const detectCompositionState = (element: HTMLElement): boolean => {
  // 检查是否有composition相关的属性或状态
  return (element as any).isComposing || false;
};

/**
 * 输入性能测试
 * @param inputFunction 输入处理函数
 * @param testData 测试数据
 */
export const performanceTestInput = async (
  inputFunction: (value: string) => void,
  testData: string[]
): Promise<{ averageTime: number; totalTime: number }> => {
  const startTime = performance.now();
  const times: number[] = [];
  
  for (const data of testData) {
    const itemStartTime = performance.now();
    inputFunction(data);
    const itemEndTime = performance.now();
    times.push(itemEndTime - itemStartTime);
  }
  
  const totalTime = performance.now() - startTime;
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 输入性能测试结果:', {
      totalTime: `${totalTime.toFixed(2)}ms`,
      averageTime: `${averageTime.toFixed(2)}ms`,
      itemCount: testData.length
    });
  }
  
  return { averageTime, totalTime };
};
