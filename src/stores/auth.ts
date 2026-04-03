import { defineStore } from "pinia";
import { AuthService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import type { LoginRequest, RegisterRequest, User } from "@/types";
const authService = new AuthService();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: (() => {
      try {
        const item = localStorage.getItem("user");
        return item && item !== "undefined" ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    })() as User | null,
    accessToken: localStorage.getItem("accessToken") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  actions: {
    async login(payload: LoginRequest) {
      const response = await authService.login(payload);
      if (response.success && response.data) {
        this.setAuth(response.data);
      }
      return response;
    },
    async register(payload: RegisterRequest) {
      const response = await authService.register(payload);
      if (response.success && response.data) {
        this.setAuth(response.data);
      }
      return response;
    },
    setAuth(data: { accessToken: string; refreshToken: string; user: User }) {
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    },
    async logout() {
      try {
        await authService.logout(this.refreshToken || undefined);
      } finally {
        this.clearAuth();
      }
    },
    clearAuth() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    async fetchUser() {
      if (!this.accessToken) return;
      try {
        const response = await userService.getMe();
        if (response.success && response.data) {
          this.user = response.data;
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    },
  },
});

