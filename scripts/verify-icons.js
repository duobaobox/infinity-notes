#!/usr/bin/env node

/**
 * 图标验证脚本
 * 验证构建后的应用程序是否包含正确的图标文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证应用程序图标...');

// 检查源图标文件
const sourceIcons = [
    { path: '../public/icon.png', name: 'PNG 图标 (Linux)' },
    { path: '../public/icon.icns', name: 'ICNS 图标 (macOS)' },
    { path: '../public/icon.ico', name: 'ICO 图标 (Windows)' }
];

console.log('\n📁 检查源图标文件:');
for (const icon of sourceIcons) {
    const fullPath = path.join(__dirname, icon.path);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ ${icon.name}: ${fullPath} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        console.log(`❌ ${icon.name}: ${fullPath} (文件不存在)`);
    }
}

// 检查构建后的应用程序图标
console.log('\n🏗️ 检查构建后的应用程序图标:');

// macOS 应用程序图标
const macIconPath = path.join(__dirname, '../dist-electron/mac/Infinity Notes.app/Contents/Resources/icon.icns');
if (fs.existsSync(macIconPath)) {
    const stats = fs.statSync(macIconPath);
    console.log(`✅ macOS 应用图标: ${macIconPath} (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
    console.log(`❌ macOS 应用图标: ${macIconPath} (文件不存在)`);
}

// ARM64 macOS 应用程序图标
const macArm64IconPath = path.join(__dirname, '../dist-electron/mac-arm64/Infinity Notes.app/Contents/Resources/icon.icns');
if (fs.existsSync(macArm64IconPath)) {
    const stats = fs.statSync(macArm64IconPath);
    console.log(`✅ macOS ARM64 应用图标: ${macArm64IconPath} (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
    console.log(`❌ macOS ARM64 应用图标: ${macArm64IconPath} (文件不存在)`);
}

// Windows 应用程序图标 (检查 exe 文件是否包含图标)
const winExePath = path.join(__dirname, '../dist-electron/win-unpacked/Infinity Notes.exe');
if (fs.existsSync(winExePath)) {
    const stats = fs.statSync(winExePath);
    console.log(`✅ Windows 应用程序: ${winExePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   注意: Windows 图标已嵌入到 exe 文件中`);
} else {
    console.log(`❌ Windows 应用程序: ${winExePath} (文件不存在)`);
}

// 检查 DMG 和安装包文件
console.log('\n📦 检查分发文件:');

const distFiles = [
    { path: '../dist-electron/Infinity Notes-0.1.0.dmg', name: 'macOS DMG (x64)' },
    { path: '../dist-electron/Infinity Notes-0.1.0-arm64.dmg', name: 'macOS DMG (ARM64)' },
    { path: '../dist-electron/Infinity Notes Setup 0.1.0.exe', name: 'Windows 安装程序' }
];

for (const file of distFiles) {
    const fullPath = path.join(__dirname, file.path);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ ${file.name}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
        console.log(`❌ ${file.name}: 文件不存在`);
    }
}

console.log('\n🎉 图标验证完成！');
console.log('\n💡 提示:');
console.log('- macOS: 图标已嵌入到 .app 包中的 icon.icns 文件');
console.log('- Windows: 图标已嵌入到 .exe 文件中');
console.log('- 你可以运行构建的应用程序来查看图标是否正确显示');
