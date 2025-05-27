# React + TypeScript + Vite

该模板提供了一个最小化的设置，使得 React 可以在 Vite 中运行，并包含了热模块替换 (HMR) 和一些 ESLint 规则。

目前，有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Babel](https://babeljs.io/) 实现快速刷新 (Fast Refresh)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/) 实现快速刷新 (Fast Refresh)

## 扩展 ESLint 配置

如果您正在开发一个生产环境的应用程序，我们建议更新配置以启用类型感知的 lint 规则：

```javascript
// eslint.config.js
import tseslint from "typescript-eslint";

export default tseslint.config({
  extends: [
    // 移除 ...tseslint.configs.recommended 并替换为此
    ...tseslint.configs.recommendedTypeChecked,
    // 或者，使用此配置以获得更严格的规则
    // ...tseslint.configs.strictTypeChecked,
    // 可选地，添加此配置以获得代码风格相关的规则
    // ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // 其他选项...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname, // 如果您的 eslint.config.js 不在项目根目录，请正确设置此路径
    },
  },
});
```

您还可以安装 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 以获取 React 特定的 lint 规则：

```javascript
// eslint.config.js
import tseslint from "typescript-eslint";
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  // ... 其他配置
  plugins: {
    // 添加 react-x 和 react-dom 插件
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // 其他规则...
    // 启用其推荐的 TypeScript 规则
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

**请注意:** 上述 ESLint 配置示例是基于 `eslint.config.js` (扁平化配置)。如果您的项目仍在使用旧版的 `.eslintrc.js` 或类似文件，配置方式会有所不同。确保根据您项目实际的 ESLint 配置版本进行调整。

**项目启动与构建**

- **开发模式**: `npm run dev`
- **生产构建**: `npm run build`
- **代码检查**: `npm run lint`
- **预览构建结果**: `npm run preview`

**技术栈**

- [Vite](https://vitejs.dev/) - 前端构建工具
- [React](https://reactjs.org/) - 用于构建用户界面的 JavaScript 库
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集，添加了类型系统
- [Ant Design](https://ant.design/) - 一个企业级 UI 设计语言和 React UI 库 (已通过 `npm install antd --save` 安装)
- [ESLint](https://eslint.org/) - 可插拔的 JavaScript 和 JSX/TSX 代码检查工具
