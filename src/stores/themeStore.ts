import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Dark } from 'quasar';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  const defaultThemeMode: ThemeMode = 'system';
  const themeMode = ref<ThemeMode>(defaultThemeMode);
  const isDark = ref(false);

  function resolveTheme(mode: ThemeMode): boolean {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function setTheme(mode: ThemeMode): void {
    themeMode.value = mode;
    isDark.value = resolveTheme(mode);
    Dark.set(isDark.value);
    localStorage.setItem('app_theme_preference', mode);
  }

  function toggleDark(): void {
    setTheme(isDark.value ? 'light' : 'dark');
  }

  /** 初始化主题：从 localStorage 读取偏好，监听系统主题变化 */
  function initTheme(): void {
    const savedRaw = localStorage.getItem('app_theme_preference');
    const saved: ThemeMode =
      savedRaw === 'light' || savedRaw === 'dark' || savedRaw === 'system'
        ? savedRaw
        : defaultThemeMode;
    setTheme(saved);

    // 监听系统主题变化（仅在 system 模式下自动切换）
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'system') {
        isDark.value = resolveTheme('system');
        Dark.set(isDark.value);
      }
    });
  }

  return { themeMode, isDark, setTheme, toggleDark, initTheme };
});
