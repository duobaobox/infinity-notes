/**
 * 简单的编辑器修复验证脚本
 * 在浏览器控制台中运行此脚本来测试修复效果
 */

console.log("🧪 开始编辑器修复验证测试");

// 监听TipTap错误
let errorCount = 0;
const originalError = console.error;
console.error = function(...args) {
  const message = args.join(" ");
  if (message.includes("tiptap error") || message.includes("view['dom']")) {
    errorCount++;
    console.log(`🚨 检测到TipTap错误 #${errorCount}: ${message}`);
  }
  originalError.apply(console, args);
};

// 测试函数
function testEditorCreation() {
  console.log("📝 测试编辑器创建...");
  
  // 模拟点击创建编辑器按钮
  const createButton = document.querySelector('button:contains("创建编辑器")');
  if (createButton) {
    createButton.click();
    console.log("✅ 点击了创建编辑器按钮");
  } else {
    console.log("❌ 未找到创建编辑器按钮");
  }
}

function testStressTest() {
  console.log("🔥 测试压力测试...");
  
  // 模拟点击压力测试按钮
  const stressButton = document.querySelector('button:contains("运行压力测试")');
  if (stressButton) {
    stressButton.click();
    console.log("✅ 点击了压力测试按钮");
  } else {
    console.log("❌ 未找到压力测试按钮");
  }
}

// 运行测试
setTimeout(() => {
  testEditorCreation();
}, 1000);

setTimeout(() => {
  testStressTest();
}, 3000);

// 5秒后报告结果
setTimeout(() => {
  console.log("📊 测试结果报告:");
  console.log(`- 检测到的TipTap错误数量: ${errorCount}`);
  if (errorCount === 0) {
    console.log("🎉 修复成功！没有检测到TipTap错误");
  } else {
    console.log("⚠️ 仍有错误，需要进一步修复");
  }
}, 8000);

console.log("⏳ 测试将在8秒内完成...");
