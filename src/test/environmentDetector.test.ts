/**
 * 环境检测器测试
 * 测试环境检测功能是否正常工作
 */

import {
  environmentDetector,
  EnvironmentType,
  isElectronEnvironment,
  isBrowserEnvironment,
  getEnvironmentInfo,
  getStorageDescription,
  getPrivacyDescription,
  getFeatureDescription,
} from "../utils/environmentDetector";

// 模拟浏览器环境
const mockBrowserEnvironment = () => {
  // 清除可能存在的 electronAPI
  delete (window as any).electronAPI;

  // 重置环境检测器
  environmentDetector.reset();
};

// 模拟 Electron 环境
const mockElectronEnvironment = () => {
  (window as any).electronAPI = {
    isElectron: true,
    platform: "darwin",
    isDev: false,
  };

  // 重置环境检测器
  environmentDetector.reset();
};

/**
 * 测试浏览器环境检测
 */
export const testBrowserEnvironmentDetection = () => {
  console.log("🧪 测试浏览器环境检测...");

  mockBrowserEnvironment();

  const envInfo = getEnvironmentInfo();

  console.log("环境信息:", envInfo);

  // 验证检测结果
  const tests = [
    {
      name: "环境类型应为浏览器",
      result: envInfo.type === EnvironmentType.BROWSER,
      expected: true,
    },
    {
      name: "isElectron应为false",
      result: envInfo.isElectron,
      expected: false,
    },
    {
      name: "isBrowser应为true",
      result: envInfo.isBrowser,
      expected: true,
    },
    {
      name: "存储描述应包含IndexedDB",
      result: envInfo.storageDescription.includes("IndexedDB"),
      expected: true,
    },
    {
      name: "数据位置描述应包含浏览器",
      result: envInfo.dataLocationDescription.includes("浏览器"),
      expected: true,
    },
  ];

  let passedTests = 0;
  tests.forEach((test) => {
    const passed = test.result === test.expected;
    console.log(`${passed ? "✅" : "❌"} ${test.name}: ${test.result}`);
    if (passed) passedTests++;
  });

  console.log(`浏览器环境测试结果: ${passedTests}/${tests.length} 通过`);
  return passedTests === tests.length;
};

/**
 * 测试 Electron 环境检测
 */
export const testElectronEnvironmentDetection = () => {
  console.log("🧪 测试 Electron 环境检测...");

  mockElectronEnvironment();

  const envInfo = getEnvironmentInfo();

  console.log("环境信息:", envInfo);

  // 验证检测结果
  const tests = [
    {
      name: "环境类型应为Electron",
      result: envInfo.type === EnvironmentType.ELECTRON,
      expected: true,
    },
    {
      name: "isElectron应为true",
      result: envInfo.isElectron,
      expected: true,
    },
    {
      name: "isBrowser应为false",
      result: envInfo.isBrowser,
      expected: false,
    },
    {
      name: "存储描述应包含文件系统",
      result: envInfo.storageDescription.includes("文件系统"),
      expected: true,
    },
    {
      name: "数据位置描述应包含客户端",
      result: envInfo.dataLocationDescription.includes("客户端"),
      expected: true,
    },
    {
      name: "平台信息应为darwin",
      result: envInfo.platform === "darwin",
      expected: true,
    },
  ];

  let passedTests = 0;
  tests.forEach((test) => {
    const passed = test.result === test.expected;
    console.log(`${passed ? "✅" : "❌"} ${test.name}: ${test.result}`);
    if (passed) passedTests++;
  });

  console.log(`Electron环境测试结果: ${passedTests}/${tests.length} 通过`);
  return passedTests === tests.length;
};

/**
 * 测试便捷函数
 */
export const testConvenienceFunctions = () => {
  console.log("🧪 测试便捷函数...");

  // 测试浏览器环境
  mockBrowserEnvironment();

  const browserTests = [
    {
      name: "isElectronEnvironment()应返回false",
      result: isElectronEnvironment(),
      expected: false,
    },
    {
      name: "isBrowserEnvironment()应返回true",
      result: isBrowserEnvironment(),
      expected: true,
    },
    {
      name: "getStorageDescription()应返回正确描述",
      result: getStorageDescription().includes("浏览器"),
      expected: true,
    },
    {
      name: "getPrivacyDescription()应包含IndexedDB",
      result: getPrivacyDescription().includes("IndexedDB"),
      expected: true,
    },
    {
      name: "getFeatureDescription()应包含浏览器",
      result: getFeatureDescription().includes("浏览器"),
      expected: true,
    },
  ];

  // 测试Electron环境
  mockElectronEnvironment();

  const electronTests = [
    {
      name: "isElectronEnvironment()应返回true",
      result: isElectronEnvironment(),
      expected: true,
    },
    {
      name: "isBrowserEnvironment()应返回false",
      result: isBrowserEnvironment(),
      expected: false,
    },
    {
      name: "getStorageDescription()应包含文件系统",
      result: getStorageDescription().includes("文件系统"),
      expected: true,
    },
    {
      name: "getPrivacyDescription()应包含离线",
      result: getPrivacyDescription().includes("离线"),
      expected: true,
    },
    {
      name: "getFeatureDescription()应包含客户端",
      result: getFeatureDescription().includes("客户端"),
      expected: true,
    },
  ];

  const allTests = [...browserTests, ...electronTests];
  let passedTests = 0;

  allTests.forEach((test) => {
    const passed = test.result === test.expected;
    console.log(`${passed ? "✅" : "❌"} ${test.name}: ${test.result}`);
    if (passed) passedTests++;
  });

  console.log(`便捷函数测试结果: ${passedTests}/${allTests.length} 通过`);
  return passedTests === allTests.length;
};

/**
 * 运行所有环境检测测试
 */
export const runAllEnvironmentTests = () => {
  console.log("🚀 开始运行环境检测测试套件...");

  const results = [
    testBrowserEnvironmentDetection(),
    testElectronEnvironmentDetection(),
    testConvenienceFunctions(),
  ];

  const passedTests = results.filter((result) => result).length;
  const totalTests = results.length;

  console.log(`\n📊 测试总结: ${passedTests}/${totalTests} 测试套件通过`);

  if (passedTests === totalTests) {
    console.log("🎉 所有环境检测测试通过！");
  } else {
    console.log("⚠️ 部分测试失败，请检查代码");
  }

  return passedTests === totalTests;
};

// 在开发环境中暴露测试函数到全局
if (process.env.NODE_ENV === "development") {
  (window as any).testEnvironmentDetection = {
    runAll: runAllEnvironmentTests,
    testBrowser: testBrowserEnvironmentDetection,
    testElectron: testElectronEnvironmentDetection,
    testFunctions: testConvenienceFunctions,
  };
}
