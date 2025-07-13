// Leader Line 加载工具 - 优先使用预加载的版本
let LeaderLineClass: any = null;

// 加载 Leader Line
export const loadLeaderLine = async (): Promise<any> => {
  // 如果已经有缓存的实例，直接返回
  if (LeaderLineClass) {
    return LeaderLineClass;
  }

  // 检查是否在浏览器环境中
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Leader Line 需要浏览器环境");
  }

  // 检查全局变量（可能已经通过 script 标签加载）
  if ((window as any).LeaderLine) {
    LeaderLineClass = (window as any).LeaderLine;
    console.log("✅ 使用预加载的 LeaderLine");
    return LeaderLineClass;
  }

  console.log("🔄 动态加载 Leader Line...");

  // 如果没有预加载，则动态加载
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/leader-line.min.js";

    const timeout = setTimeout(() => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error("Leader Line 加载超时"));
    }, 8000); // 8秒超时

    script.onload = () => {
      clearTimeout(timeout);
      if ((window as any).LeaderLine) {
        LeaderLineClass = (window as any).LeaderLine;
        console.log("✅ Leader Line 动态加载成功");
        resolve(LeaderLineClass);
      } else {
        reject(new Error("Leader Line 加载失败：未找到全局变量"));
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Leader Line 脚本加载失败"));
    };

    document.head.appendChild(script);
  });
};

// 检查 Leader Line 是否已加载
export const isLeaderLineLoaded = (): boolean => {
  return (
    LeaderLineClass !== null ||
    (typeof window !== "undefined" && !!(window as any).LeaderLine)
  );
};

// 重置加载状态（用于测试）
export const resetLeaderLineLoader = () => {
  LeaderLineClass = null;
  if (typeof window !== "undefined") {
    delete (window as any).LeaderLine;
  }
};
