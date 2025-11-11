import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: string; name: string; email: string } | null,
    token: null as string | null,
    isAuthenticated: false,
    isAuthenticating: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
  },

  actions: {
    async login(email: string, password: string) {
      this.isAuthenticating = true;
      try {
        // In a real app, this would be an API call to your backend
        // For now, we'll simulate the authentication
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        // Simulated successful login
        this.user = {
          id: '1',
          name: '张医生',
          email: email
        };
        this.token = 'simulated-jwt-token-' + Math.random().toString(36);
        this.isAuthenticated = true;
        
        return { success: true };
      } catch (error) {
        return { success: false, error };
      } finally {
        this.isAuthenticating = false;
      }
    },

    logout() {
      // In a real app, you might want to call an API to invalidate the token
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
    },

    // Method to set user data from existing token (e.g., on app initialization)
    setAuthData(token: string, user: { id: string; name: string; email: string }) {
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
    }
  },
})