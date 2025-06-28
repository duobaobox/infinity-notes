// 用户状态管理Store
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "../database";
import { getDatabaseService } from "../database/useIndexedDB";

// 用户状态接口
export interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// 用户操作接口
export interface UserActions {
  // 用户信息操作
  loadCurrentUser: () => Promise<void>;
  updateUserProfile: (
    updates: Partial<Pick<User, "username" | "email">>
  ) => Promise<void>;

  // 状态操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 默认用户ID
const DEFAULT_USER_ID = "default_user";

// 创建用户Store
export const useUserStore = create<UserState & UserActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      loading: false,
      error: null,

      // 加载当前用户信息
      loadCurrentUser: async () => {
        try {
          set({ loading: true, error: null });

          const dbService = getDatabaseService();
          await dbService.initialize();

          const user = await dbService.getUserById(DEFAULT_USER_ID);

          if (user) {
            set({ currentUser: user, loading: false });
          } else {
            // 如果用户不存在，创建默认用户
            const defaultUser = await dbService.createUser({
              id: DEFAULT_USER_ID,
              username: "用户",
              email: "user@example.com",
            });
            set({ currentUser: defaultUser, loading: false });
          }
        } catch (error) {
          console.error("加载用户信息失败:", error);
          set({
            error: error instanceof Error ? error.message : "加载用户信息失败",
            loading: false,
          });
        }
      },

      // 更新用户资料
      updateUserProfile: async (updates) => {
        try {
          set({ loading: true, error: null });

          const { currentUser } = get();
          if (!currentUser) {
            throw new Error("当前用户不存在");
          }

          const dbService = getDatabaseService();
          await dbService.initialize();

          // 更新用户信息
          const updatedUser: User = {
            ...currentUser,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          await dbService.updateUser(updatedUser);

          set({
            currentUser: updatedUser,
            loading: false,
          });

          console.log("✅ 用户信息更新成功:", updatedUser);
        } catch (error) {
          console.error("更新用户信息失败:", error);
          set({
            error: error instanceof Error ? error.message : "更新用户信息失败",
            loading: false,
          });
          throw error;
        }
      },

      // 状态操作
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "user-store", // DevTools中的名称
    }
  )
);

// 初始化用户Store
export const initializeUserStore = async () => {
  const { loadCurrentUser } = useUserStore.getState();
  await loadCurrentUser();
};
