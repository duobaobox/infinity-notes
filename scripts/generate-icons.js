#!/usr/bin/env node

/**
 * 图标生成脚本
 * 从 PNG 图标生成 macOS (.icns) 和 Windows (.ico) 格式的图标
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import png2icons from "png2icons";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const inputPng = path.join(__dirname, "../public/icon.png");
const outputIcns = path.join(__dirname, "../public/icon.icns");
const outputIco = path.join(__dirname, "../public/icon.ico");

console.log("🎨 开始生成应用图标...");

// 检查输入文件是否存在
if (!fs.existsSync(inputPng)) {
  console.error("❌ 错误: 找不到输入的 PNG 图标文件:", inputPng);
  process.exit(1);
}

try {
  // 生成 macOS .icns 文件
  console.log("📱 正在生成 macOS .icns 图标...");

  // 使用 sips 工具生成 .icns 文件
  // 首先创建一个临时的 iconset 目录
  const iconsetDir = path.join(__dirname, "../temp.iconset");

  // 创建 iconset 目录
  if (fs.existsSync(iconsetDir)) {
    execSync(`rm -rf "${iconsetDir}"`);
  }
  fs.mkdirSync(iconsetDir);

  // 生成不同尺寸的图标
  const sizes = [
    { size: 16, name: "icon_16x16.png" },
    { size: 32, name: "icon_16x16@2x.png" },
    { size: 32, name: "icon_32x32.png" },
    { size: 64, name: "icon_32x32@2x.png" },
    { size: 128, name: "icon_128x128.png" },
    { size: 256, name: "icon_128x128@2x.png" },
    { size: 256, name: "icon_256x256.png" },
    { size: 512, name: "icon_256x256@2x.png" },
    { size: 512, name: "icon_512x512.png" },
    { size: 1024, name: "icon_512x512@2x.png" },
  ];

  // 使用 sips 生成各种尺寸的图标
  for (const { size, name } of sizes) {
    const outputPath = path.join(iconsetDir, name);
    execSync(`sips -z ${size} ${size} "${inputPng}" --out "${outputPath}"`);
  }

  // 使用 iconutil 生成 .icns 文件
  execSync(`iconutil -c icns "${iconsetDir}" -o "${outputIcns}"`);

  // 清理临时目录
  execSync(`rm -rf "${iconsetDir}"`);

  console.log("✅ macOS .icns 图标生成成功");

  // 生成 Windows .ico 文件
  console.log("🪟 正在生成 Windows .ico 图标...");

  // 读取 PNG 文件
  const input = fs.readFileSync(inputPng);

  // 使用 png2icons 生成 .ico 文件
  const output = png2icons.createICO(input, png2icons.BILINEAR, 0, false, true);

  // 写入 .ico 文件
  fs.writeFileSync(outputIco, output);

  console.log("✅ Windows .ico 图标生成成功");

  console.log("🎉 所有图标生成完成！");
  console.log(`📁 生成的文件:`);
  console.log(`   - macOS: ${outputIcns}`);
  console.log(`   - Windows: ${outputIco}`);
  console.log(`   - Linux: ${inputPng}`);
} catch (error) {
  console.error("❌ 生成图标时出错:", error.message);
  process.exit(1);
}
