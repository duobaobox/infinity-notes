// 使用 IndexedDB 存储 UI 设置
import { IndexedDBService } from "./IndexedDBService";

// 定义 UI 设置类型
export interface ThemeSettings {
  theme: "light" | "dark" | "auto";
  isDarkMode: boolean;
}

export interface AppearanceSettings {
  canvasBackground: string;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  gridMajorColor: string;
  // 便签默认尺寸设置
  manualNoteDefaultWidth: number; // 手动便签默认宽度
  manualNoteDefaultHeight: number; // 手动便签默认高度
  aiNoteDefaultWidth: number; // AI便签默认宽度
  aiNoteDefaultHeight: number; // AI便签默认高度
}

export interface UILayoutSettings {
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;
  toolbarVisible: boolean;
}

// 基础设置接口
export interface BasicSettings {
  showThinkingMode: boolean; // 是否显示思维模式
}

// 缩放敏感度设置接口
export interface ZoomSensitivitySettings {
  enabled: boolean; // 是否启用智能缩放敏感度
  smallScrollThreshold: number; // 小幅滚动阈值
  mediumScrollThreshold: number; // 中等滚动阈值
  smallScrollSteps: number; // 小幅滚动跳跃级数
  mediumScrollSteps: number; // 中等滚动跳跃级数
  largeScrollSteps: number; // 大幅滚动跳跃级数
}

// 画布控制设置接口
export interface CanvasControlSettings {
  isWheelZoomDisabled: boolean; // 是否禁用滚轮缩放
}

// 定义存储在 IndexedDB 中的 UI 设置结构
interface StoredUISettings {
  id: string;
  user_id: string;
  setting_type:
    | "theme"
    | "appearance"
    | "layout"
    | "basic"
    | "zoom-sensitivity"
    | "canvas-control";
  settings:
    | ThemeSettings
    | AppearanceSettings
    | UILayoutSettings
    | BasicSettings
    | ZoomSensitivitySettings
    | CanvasControlSettings;
  updated_at: string;
}

export class IndexedDBUISettingsStorage {
  private static readonly DEFAULT_USER_ID = "default";

  // 保存主题设置
  static async saveThemeSettings(settings: ThemeSettings): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存主题设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-theme",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "theme",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: 主题设置保存成功");
    } catch (error) {
      console.error("保存主题设置失败:", error);
      throw new Error("保存主题设置失败");
    }
  }

  // 加载主题设置
  static async loadThemeSettings(): Promise<ThemeSettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-theme"
      );

      if (result && result.setting_type === "theme") {
        console.log(
          "💾 IndexedDBUISettingsStorage: 主题设置加载成功",
          result.settings
        );
        return result.settings as ThemeSettings;
      }

      return null;
    } catch (error) {
      console.error("加载主题设置失败:", error);
      return null;
    }
  }

  // 保存外观设置
  static async saveAppearanceSettings(
    settings: AppearanceSettings
  ): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存外观设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-appearance",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "appearance",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: 外观设置保存成功");
    } catch (error) {
      console.error("保存外观设置失败:", error);
      throw new Error("保存外观设置失败");
    }
  }

  // 加载外观设置
  static async loadAppearanceSettings(): Promise<AppearanceSettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-appearance"
      );

      if (result && result.setting_type === "appearance") {
        console.log(
          "💾 IndexedDBUISettingsStorage: 外观设置加载成功",
          result.settings
        );
        return result.settings as AppearanceSettings;
      }

      return null;
    } catch (error) {
      console.error("加载外观设置失败:", error);
      return null;
    }
  }

  // 保存UI布局设置
  static async saveUILayoutSettings(settings: UILayoutSettings): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存UI布局设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-layout",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "layout",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: UI布局设置保存成功");
    } catch (error) {
      console.error("保存UI布局设置失败:", error);
      throw new Error("保存UI布局设置失败");
    }
  }

  // 加载UI布局设置
  static async loadUILayoutSettings(): Promise<UILayoutSettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-layout"
      );

      if (result && result.setting_type === "layout") {
        console.log(
          "💾 IndexedDBUISettingsStorage: UI布局设置加载成功",
          result.settings
        );
        return result.settings as UILayoutSettings;
      }

      return null;
    } catch (error) {
      console.error("加载UI布局设置失败:", error);
      return null;
    }
  }

  // 保存基础设置
  static async saveBasicSettings(settings: BasicSettings): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存基础设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-basic",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "basic",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: 基础设置保存成功");
    } catch (error) {
      console.error("保存基础设置失败:", error);
      throw new Error("保存基础设置失败");
    }
  }

  // 保存缩放敏感度设置
  static async saveZoomSensitivitySettings(
    settings: ZoomSensitivitySettings
  ): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存缩放敏感度设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-zoom-sensitivity",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "zoom-sensitivity",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: 缩放敏感度设置保存成功");
    } catch (error) {
      console.error("保存缩放敏感度设置失败:", error);
      throw new Error("保存缩放敏感度设置失败");
    }
  }

  // 加载基础设置
  static async loadBasicSettings(): Promise<BasicSettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-basic"
      );

      if (result && result.setting_type === "basic") {
        console.log(
          "💾 IndexedDBUISettingsStorage: 基础设置加载成功",
          result.settings
        );
        return result.settings as BasicSettings;
      }

      return null;
    } catch (error) {
      console.error("加载基础设置失败:", error);
      return null;
    }
  }

  // 加载缩放敏感度设置
  static async loadZoomSensitivitySettings(): Promise<ZoomSensitivitySettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-zoom-sensitivity"
      );

      if (result && result.setting_type === "zoom-sensitivity") {
        console.log(
          "💾 IndexedDBUISettingsStorage: 缩放敏感度设置加载成功",
          result.settings
        );
        return result.settings as ZoomSensitivitySettings;
      }

      return null;
    } catch (error) {
      console.error("加载缩放敏感度设置失败:", error);
      return null;
    }
  }

  // 清除所有UI设置
  static async clearAllSettings(): Promise<void> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      await Promise.all([
        db.deleteItem("ui_settings", "ui-theme"),
        db.deleteItem("ui_settings", "ui-appearance"),
        db.deleteItem("ui_settings", "ui-layout"),
      ]);

      console.log("💾 IndexedDBUISettingsStorage: 所有UI设置已清除");
    } catch (error) {
      console.error("清除UI设置失败:", error);
    }
  }

  // 数据迁移：从localStorage迁移到IndexedDB
  static async migrateFromLocalStorage(): Promise<void> {
    console.log("💾 开始从localStorage迁移UI设置到IndexedDB");

    try {
      // 迁移主题设置
      const savedTheme = localStorage.getItem("ui-theme");
      if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
        const themeSettings: ThemeSettings = {
          theme: savedTheme as "light" | "dark" | "auto",
          isDarkMode:
            savedTheme === "dark" ||
            (savedTheme === "auto" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches),
        };
        await this.saveThemeSettings(themeSettings);
        localStorage.removeItem("ui-theme");
        console.log("✅ 主题设置迁移完成");
      }

      // 迁移外观设置
      const savedAppearance = localStorage.getItem("ui-appearance");
      if (savedAppearance) {
        try {
          const appearance = JSON.parse(savedAppearance) as AppearanceSettings;
          await this.saveAppearanceSettings(appearance);
          localStorage.removeItem("ui-appearance");
          console.log("✅ 外观设置迁移完成");
        } catch (error) {
          console.warn("解析外观设置失败:", error);
        }
      }

      console.log("💾 UI设置迁移完成");
    } catch (error) {
      console.error("UI设置迁移失败:", error);
    }
  }

  // 保存画布控制设置
  static async saveCanvasControlSettings(
    settings: CanvasControlSettings
  ): Promise<void> {
    console.log("💾 IndexedDBUISettingsStorage: 保存画布控制设置", settings);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const settingsToSave: StoredUISettings = {
        id: "ui-canvas-control",
        user_id: this.DEFAULT_USER_ID,
        setting_type: "canvas-control",
        settings,
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ui_settings", settingsToSave);
      console.log("💾 IndexedDBUISettingsStorage: 画布控制设置保存成功");
    } catch (error) {
      console.error("保存画布控制设置失败:", error);
      throw new Error("保存画布控制设置失败");
    }
  }

  // 加载画布控制设置
  static async loadCanvasControlSettings(): Promise<CanvasControlSettings | null> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const result = await db.getItem<StoredUISettings>(
        "ui_settings",
        "ui-canvas-control"
      );

      if (result && result.setting_type === "canvas-control") {
        console.log(
          "💾 IndexedDBUISettingsStorage: 画布控制设置加载成功",
          result.settings
        );
        return result.settings as CanvasControlSettings;
      }

      console.log("💾 IndexedDBUISettingsStorage: 未找到画布控制设置");
      return null;
    } catch (error) {
      console.error("加载画布控制设置失败:", error);
      return null;
    }
  }
}
