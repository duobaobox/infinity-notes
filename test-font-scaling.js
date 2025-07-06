// 测试脚本：验证字体大小计算
console.log("=== 字体缩放优化测试 ===");

// 模拟不同的缩放级别
const testScales = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const baseSize = 14; // 基础字体大小

console.log("缩放级别\t基础大小\t最终大小\t说明");
console.log("--------\t--------\t--------\t----");

testScales.forEach((scale) => {
  const finalSize = baseSize * scale;
  const scaledSize = Math.max(10, Math.min(22, finalSize)); // 应用范围限制

  // 模拟设备像素比对齐 (假设DPR = 2，模拟Retina显示器)
  const dpr = 2;
  const devicePixelSize = scaledSize * dpr;
  const alignedDevicePixelSize = Math.round(devicePixelSize);
  const alignedSize = alignedDevicePixelSize / dpr;

  console.log(
    `${(scale * 100).toFixed(
      0
    )}%\t\t${baseSize}px\t\t${alignedSize}px\t\t直接缩放，无CSS transform`
  );
});

console.log("\n=== 原理说明 ===");
console.log("新方法：baseSize * scale = 最终字体大小");
console.log("优势：");
console.log("1. 避免CSS transform缩放导致的文本模糊");
console.log("2. 直接控制字体大小，确保像素完美对齐");
console.log("3. 便签的位置和尺寸也直接缩放，不依赖CSS transform");
console.log("4. 简化代码，提高性能");

console.log("\n=== 对比旧方法 ===");
console.log("旧方法：baseSize + (scale - 1) * 4 + CSS transform scale");
console.log("问题：双重缩放导致非整数像素，引起文本模糊");
