# 贡献指南

感谢您对无限便签项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、设计、测试和反馈。

## 🤝 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请：

1. 检查[现有 issues](../../issues)，避免重复报告
2. 使用清晰的标题描述问题
3. 提供详细的复现步骤
4. 包含您的环境信息（浏览器、操作系统等）
5. 如果可能，提供截图或错误日志

### 提交代码

1. **Fork 项目**

   ```bash
   git clone https://github.com/your-username/infinity-notes.git
   cd infinity-notes
   ```

2. **创建功能分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **开发和测试**

   ```bash
   npm run dev          # 启动开发服务器
   npm run lint         # 代码检查
   npm run type-check   # 类型检查
   npm run build        # 构建测试
   ```

5. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

6. **推送分支**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**

## 📝 代码规范

### 提交信息规范

我们使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建工具或辅助工具的变动

示例：

```
feat: 添加AI汇总功能
fix: 修复便签拖拽时的位置偏移问题
docs: 更新API文档
```

### 代码风格

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码规范
- 使用有意义的变量和函数名
- 添加必要的注释，特别是复杂逻辑
- 保持函数简洁，单一职责

### 文件组织

- 新组件放在`src/components/`对应的子目录中
- 工具函数放在`src/utils/`目录
- 类型定义放在`src/types/`目录
- 每个模块都应该有对应的 README 文档

## 🧪 测试

- 为新功能编写测试用例
- 确保所有测试通过
- 测试文件放在`tests/`目录中
- 使用描述性的测试名称

## 📚 文档

- 更新相关的 README 文档
- 为新功能添加使用说明
- 保持文档与代码同步
- 使用清晰的中文描述

## 🎯 开发重点

当前项目重点关注以下方面：

1. **性能优化**: 大量便签时的渲染性能
2. **用户体验**: 交互的流畅性和直观性
3. **AI 功能**: 智能汇总的准确性和实用性
4. **数据安全**: 本地数据的安全存储
5. **跨平台**: 不同浏览器和设备的兼容性

## 🚫 不接受的贡献

- 破坏现有功能的更改
- 未经讨论的重大架构变更
- 不符合项目目标的功能
- 缺乏测试的代码
- 不符合代码规范的提交

## 📞 联系方式

如果您有任何问题或建议，可以通过以下方式联系我们：

- 创建[GitHub Issue](../../issues)
- 参与[GitHub Discussions](../../discussions)

## 🙏 致谢

感谢所有为项目做出贡献的开发者！您的每一个贡献都让这个项目变得更好。

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT 许可证](LICENSE)下发布。
