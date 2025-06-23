import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0", // 允许外部访问，便于内网测试
    strictPort: true, // 如果端口被占用，会报错而不是尝试其他端口
  },
  preview: {
    port: 4173,
    host: "0.0.0.0", // 生产预览也允许外部访问
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false, // 生产环境不生成 sourcemap
    minify: "esbuild", // 使用 esbuild 压缩
    rollupOptions: {
      // 多页面应用配置
      input: {
        main: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
        landing: resolve(__dirname, "landing.html"),
      },
      output: {
        // 分包策略，优化加载性能
        manualChunks: {
          vendor: ["react", "react-dom"],
          antd: ["antd"],
          utils: ["lodash", "uuid"],
        },
      },
    },
  },
});
