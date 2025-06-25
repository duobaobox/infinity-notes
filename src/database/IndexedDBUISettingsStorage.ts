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
  noteDefaultColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface UILayoutSettings {
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;
  toolbarVisible: boolean;
}

// 定义存储在 IndexedDB 中的 UI 设置结构
interface StoredUISettings {
  id: string;
  user_id: string;
  setting_type: "theme" | "appearance" | "layout";
  settings: ThemeSettings | AppearanceSettings | UILayoutSettings;
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
}
